import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../auth/auth.types';
import { EstadoMateria } from '../../generated/prisma/client';
import { Role } from '../../generated/prisma/client';
import { BoletimService } from '../boletim/boletim.service';
import {
  garantirAcessoLeituraMateria,
  garantirPosseProfessor,
} from '../common/posse.util';
import { CreateItemAvaliacaoDto } from './dto/create-item-avaliacao.dto';
import { UpdateItemAvaliacaoDto } from './dto/update-item-avaliacao.dto';
import { SetNotasDto } from './dto/set-notas.dto';
import { ConfigurarRegraDto } from './dto/configurar-regra.dto';

@Injectable()
export class PlanoDisciplinaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly boletim: BoletimService,
  ) {}

  private async carregarMateria(materiaId: string, user: AuthenticatedUser) {
    const materia = await this.prisma.materia.findUnique({
      where: { id: materiaId },
    });
    if (!materia) {
      throw new NotFoundException('Disciplina não encontrada');
    }
    await garantirAcessoLeituraMateria(
      this.prisma,
      user,
      materia,
      'Disciplina não encontrada',
    );
    return materia;
  }

  private garantirAberta(materia: { estado: EstadoMateria }) {
    if (materia.estado !== EstadoMateria.ABERTA) {
      throw new BadRequestException(
        'Só é possível editar o plano de disciplina enquanto a Disciplina estiver aberta',
      );
    }
  }

  private async carregarItemComPosse(itemId: string, user: AuthenticatedUser) {
    const item = await this.prisma.itemAvaliacao.findUnique({
      where: { id: itemId },
      include: { materia: true },
    });
    if (!item) {
      throw new NotFoundException('Item de avaliação não encontrado');
    }
    garantirPosseProfessor(
      user,
      item.materia.professorId,
      'Item de avaliação não encontrado',
    );
    return item;
  }

  async criarItem(
    materiaId: string,
    dto: CreateItemAvaliacaoDto,
    user: AuthenticatedUser,
  ) {
    const materia = await this.carregarMateria(materiaId, user);
    this.garantirAberta(materia);
    return this.prisma.itemAvaliacao.create({
      data: {
        materiaId,
        nome: dto.nome,
        valorMaximo: dto.valorMaximo,
        // Peso inicial 1: item conta igual aos outros na média até o professor customizar
        // pesos pela regra de aprovação.
        peso: 1,
        especial: dto.especial ?? false,
      },
    });
  }

  async listarItens(materiaId: string, user: AuthenticatedUser) {
    await this.carregarMateria(materiaId, user);
    const itens = await this.prisma.itemAvaliacao.findMany({
      where: { materiaId },
    });
    return itens.map((item) => ({
      ...item,
      valorMaximo: item.valorMaximo.toString(),
      peso: item.peso.toString(),
      notaMetaMinima: item.notaMetaMinima?.toString() ?? null,
    }));
  }

  /** Pesos, modo dos itens especiais (ponderada/substitui item/substitui média) e nota meta
   * mínima — configurados de uma vez pra disciplina inteira, normais e especiais juntos. */
  async configurarRegra(
    materiaId: string,
    dto: ConfigurarRegraDto,
    user: AuthenticatedUser,
  ) {
    const materia = await this.carregarMateria(materiaId, user);
    garantirPosseProfessor(
      user,
      materia.professorId,
      'Disciplina não encontrada',
    );
    this.garantirAberta(materia);

    const itensDaMateria = await this.prisma.itemAvaliacao.findMany({
      where: { materiaId },
    });
    const itensPorId = new Map(itensDaMateria.map((item) => [item.id, item]));

    for (const config of dto.itens) {
      const item = itensPorId.get(config.itemAvaliacaoId);
      if (!item) {
        throw new BadRequestException(
          'Todos os itens configurados devem pertencer a esta Disciplina',
        );
      }
      if (config.modoEspecial && !item.especial) {
        throw new BadRequestException(
          `"${item.nome}" não é um item especial, não pode ter modoEspecial`,
        );
      }
      if (config.itemSubstituidoId) {
        const substituido = itensPorId.get(config.itemSubstituidoId);
        if (!substituido || substituido.especial) {
          throw new BadRequestException(
            'O item substituído precisa ser um item normal desta mesma Disciplina',
          );
        }
      }
    }

    await this.prisma.$transaction(
      dto.itens.map((config) =>
        this.prisma.itemAvaliacao.update({
          where: { id: config.itemAvaliacaoId },
          data: {
            peso: config.peso,
            modoEspecial: config.modoEspecial,
            itemSubstituidoId: config.itemSubstituidoId,
            notaMetaMinima: config.notaMetaMinima,
          },
        }),
      ),
    );

    return this.listarItens(materiaId, user);
  }

  /** Marca (ou desmarca) se um item especial vale pra nota de UM aluno específico —
   * recuperação/prova final não é pra turma inteira. */
  async definirItemEspecialAluno(
    itemId: string,
    alunoId: string,
    habilitado: boolean,
    user: AuthenticatedUser,
  ) {
    const item = await this.carregarItemComPosse(itemId, user);
    this.garantirAberta(item.materia);
    if (!item.especial) {
      throw new BadRequestException('Este item não é um item especial');
    }
    const vinculado = await this.prisma.vinculoAlunoMateria.findUnique({
      where: { alunoId_materiaId: { alunoId, materiaId: item.materiaId } },
    });
    if (!vinculado) {
      throw new BadRequestException(
        'Aluno não está vinculado a esta Disciplina',
      );
    }

    if (habilitado) {
      await this.prisma.itemEspecialAluno.upsert({
        where: {
          itemAvaliacaoId_alunoId: { itemAvaliacaoId: itemId, alunoId },
        },
        create: { itemAvaliacaoId: itemId, alunoId },
        update: {},
      });
    } else {
      await this.prisma.itemEspecialAluno.deleteMany({
        where: { itemAvaliacaoId: itemId, alunoId },
      });
    }
    return { habilitado };
  }

  async atualizarItem(
    id: string,
    dto: UpdateItemAvaliacaoDto,
    user: AuthenticatedUser,
  ) {
    const item = await this.carregarItemComPosse(id, user);
    this.garantirAberta(item.materia);
    return this.prisma.itemAvaliacao.update({
      where: { id },
      data: { nome: dto.nome, valorMaximo: dto.valorMaximo },
    });
  }

  async removerItem(id: string, user: AuthenticatedUser) {
    const item = await this.carregarItemComPosse(id, user);
    this.garantirAberta(item.materia);
    return this.prisma.itemAvaliacao.delete({ where: { id } });
  }

  async setNotas(itemId: string, dto: SetNotasDto, user: AuthenticatedUser) {
    const item = await this.carregarItemComPosse(itemId, user);
    this.garantirAberta(item.materia);

    const alunoIds = dto.notas.map((n) => n.alunoId);
    const vinculados = await this.prisma.vinculoAlunoMateria.count({
      where: { materiaId: item.materiaId, alunoId: { in: alunoIds } },
    });
    if (vinculados !== alunoIds.length) {
      throw new BadRequestException(
        'Todos os alunos devem estar vinculados a esta Disciplina',
      );
    }
    const excedeu = dto.notas.some(
      (n) => n.valorObtido > item.valorMaximo.toNumber(),
    );
    if (excedeu) {
      throw new BadRequestException(
        `Nota não pode exceder o valor máximo do item (${item.valorMaximo.toNumber()})`,
      );
    }

    await this.prisma.$transaction(
      dto.notas.map((n) =>
        this.prisma.nota.upsert({
          where: {
            itemAvaliacaoId_alunoId: {
              itemAvaliacaoId: itemId,
              alunoId: n.alunoId,
            },
          },
          create: {
            itemAvaliacaoId: itemId,
            alunoId: n.alunoId,
            valorObtido: n.valorObtido,
          },
          update: { valorObtido: n.valorObtido },
        }),
      ),
    );

    return this.prisma.nota.findMany({
      where: { itemAvaliacaoId: itemId },
      include: { aluno: { select: { id: true, nome: true, matricula: true } } },
    });
  }

  async boletimMateria(materiaId: string, user: AuthenticatedUser) {
    await this.carregarMateria(materiaId, user);
    const linhas = await this.boletim.calcularBoletimMateria(materiaId);
    // Aluno só vê a própria linha do boletim, nunca a da turma inteira.
    if (user.role === Role.ALUNO) {
      return linhas.filter((linha) => linha.aluno.id === user.alunoId);
    }
    return linhas;
  }

  /** Detalhamento de notas por item de UM aluno — usado pelo professor pra editar as notas
   * já lançadas dele a partir do boletim, sem precisar abrir item por item. */
  async detalhamentoAluno(
    materiaId: string,
    alunoId: string,
    user: AuthenticatedUser,
  ) {
    await this.carregarMateria(materiaId, user);
    const vinculado = await this.prisma.vinculoAlunoMateria.findUnique({
      where: { alunoId_materiaId: { alunoId, materiaId } },
    });
    if (!vinculado) {
      throw new NotFoundException('Aluno não vinculado a esta disciplina');
    }

    const itens = await this.prisma.itemAvaliacao.findMany({
      where: { materiaId },
      include: {
        notas: { where: { alunoId } },
        alunosHabilitados: { where: { alunoId } },
      },
    });
    return itens.map((item) => ({
      id: item.id,
      nome: item.nome,
      valorMaximo: item.valorMaximo.toString(),
      valorObtido: item.notas[0] ? item.notas[0].valorObtido.toString() : '0',
      especial: item.especial,
      habilitadoParaAluno: item.alunosHabilitados.length > 0,
    }));
  }

  async meuDetalhamento(materiaId: string, user: AuthenticatedUser) {
    await this.carregarMateria(materiaId, user);

    const itens = await this.prisma.itemAvaliacao.findMany({
      where: { materiaId },
      include: {
        notas: { where: { alunoId: user.alunoId! } },
        alunosHabilitados: { where: { alunoId: user.alunoId! } },
      },
    });
    return itens.map((item) => ({
      id: item.id,
      nome: item.nome,
      valorMaximo: item.valorMaximo.toString(),
      valorObtido: item.notas[0] ? item.notas[0].valorObtido.toString() : '0',
      especial: item.especial,
      habilitadoParaAluno: item.alunosHabilitados.length > 0,
    }));
  }
}
