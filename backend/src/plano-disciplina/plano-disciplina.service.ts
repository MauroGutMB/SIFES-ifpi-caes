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
      throw new NotFoundException('Matéria não encontrada');
    }
    await garantirAcessoLeituraMateria(
      this.prisma,
      user,
      materia,
      'Matéria não encontrada',
    );
    return materia;
  }

  private garantirAberta(materia: { estado: EstadoMateria }) {
    if (materia.estado !== EstadoMateria.ABERTA) {
      throw new BadRequestException(
        'Só é possível editar o plano de disciplina enquanto a Matéria estiver aberta',
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
      data: { materiaId, nome: dto.nome, valorMaximo: dto.valorMaximo },
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
    }));
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
        'Todos os alunos devem estar vinculados a esta Matéria',
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

  async meuDetalhamento(materiaId: string, user: AuthenticatedUser) {
    await this.carregarMateria(materiaId, user);

    const itens = await this.prisma.itemAvaliacao.findMany({
      where: { materiaId },
      include: { notas: { where: { alunoId: user.alunoId! } } },
    });
    return itens.map((item) => ({
      id: item.id,
      nome: item.nome,
      valorMaximo: item.valorMaximo.toString(),
      valorObtido: item.notas[0] ? item.notas[0].valorObtido.toString() : '0',
    }));
  }
}
