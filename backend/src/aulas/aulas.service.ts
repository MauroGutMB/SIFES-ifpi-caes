import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../auth/auth.types';
import { Role } from '../../generated/prisma/client';
import {
  garantirAcessoLeituraMateria,
  garantirPosseProfessor,
} from '../common/posse.util';
import { hojeComoBrasiliaFake } from '../common/tempo.util';
import { calcularEstadoAula } from './estado-aula.util';
import { UpdateAulaDto } from './dto/update-aula.dto';
import { SetFrequenciasDto } from './dto/set-frequencias.dto';
import { OverrideAulaDto } from './dto/override-aula.dto';

@Injectable()
export class AulasService {
  constructor(private readonly prisma: PrismaService) {}

  /** Checagem de posse: professor só acessa Aulas de Matérias em que é responsável. */
  private async carregarAulaComPosse(id: string, user: AuthenticatedUser) {
    const aula = await this.prisma.aula.findUnique({
      where: { id },
      include: { materia: true },
    });
    if (!aula) {
      throw new NotFoundException('Aula não encontrada');
    }
    garantirPosseProfessor(
      user,
      aula.materia.professorId,
      'Aula não encontrada',
    );
    return aula;
  }

  private async carregarMateriaComAcessoLeitura(
    materiaId: string,
    user: AuthenticatedUser,
  ) {
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

  async findAllPorMateria(materiaId: string, user: AuthenticatedUser) {
    await this.carregarMateriaComAcessoLeitura(materiaId, user);
    // Aulas com data futura não aparecem pra professor/aluno — só o admin, que usa essa
    // mesma listagem pra gerenciar overrides, enxerga o calendário completo do semestre.
    const filtroData =
      user.role === Role.ADMIN ? {} : { data: { lte: hojeComoBrasiliaFake() } };
    const aulas = await this.prisma.aula.findMany({
      where: { materiaId, ...filtroData },
      include: { _count: { select: { frequencias: true } } },
      orderBy: { data: 'asc' },
    });
    return aulas.map(({ _count, ...aula }) => ({
      ...aula,
      estado: calcularEstadoAula({
        estadoOverride: aula.estadoOverride,
        temFrequencias: _count.frequencias > 0,
      }),
    }));
  }

  async findOne(id: string, user: AuthenticatedUser) {
    const aula = await this.carregarAulaComPosse(id, user);
    const [vinculados, existentes] = await Promise.all([
      this.prisma.vinculoAlunoMateria.findMany({
        where: { materiaId: aula.materiaId },
        include: {
          aluno: { select: { id: true, nome: true, matricula: true } },
        },
        orderBy: { aluno: { nome: 'asc' } },
      }),
      this.prisma.frequencia.findMany({ where: { aulaId: id } }),
    ]);
    const statusPorAluno = new Map(
      existentes.map((f) => [f.alunoId, f.status]),
    );
    // A aula nunca lançada não tem Frequencia salva ainda — a lista sempre parte do
    // vínculo da turma com a matéria, não do que já foi registrado, senão o professor
    // não teria como lançar frequência pela primeira vez.
    const frequencias = vinculados.map((vinculo) => ({
      id: existentes.find((f) => f.alunoId === vinculo.alunoId)?.id ?? null,
      aulaId: id,
      alunoId: vinculo.alunoId,
      status: statusPorAluno.get(vinculo.alunoId) ?? ('PRESENTE' as const),
      aluno: vinculo.aluno,
    }));
    const estado = calcularEstadoAula({
      estadoOverride: aula.estadoOverride,
      temFrequencias: existentes.length > 0,
    });
    return { ...aula, estado, frequencias };
  }

  private garantirDataNaoFutura(aula: { data: Date }, mensagem: string) {
    if (aula.data.getTime() > hojeComoBrasiliaFake().getTime()) {
      throw new BadRequestException(mensagem);
    }
  }

  async update(id: string, dto: UpdateAulaDto, user: AuthenticatedUser) {
    const aula = await this.carregarAulaComPosse(id, user);
    this.garantirDataNaoFutura(
      aula,
      'Não é possível editar uma aula com data futura',
    );
    return this.prisma.aula.update({
      where: { id },
      data: { titulo: dto.titulo, descricao: dto.descricao },
    });
  }

  async setFrequencias(
    id: string,
    dto: SetFrequenciasDto,
    user: AuthenticatedUser,
  ) {
    const aula = await this.carregarAulaComPosse(id, user);
    this.garantirDataNaoFutura(
      aula,
      'Não é possível lançar frequência de uma aula com data futura',
    );

    const alunoIds = dto.frequencias.map((f) => f.alunoId);
    const vinculados = await this.prisma.vinculoAlunoMateria.count({
      where: { materiaId: aula.materiaId, alunoId: { in: alunoIds } },
    });
    if (vinculados !== alunoIds.length) {
      throw new BadRequestException(
        'Todos os alunos devem estar vinculados a esta Matéria',
      );
    }

    await this.prisma.$transaction(
      dto.frequencias.map((item) =>
        this.prisma.frequencia.upsert({
          where: { aulaId_alunoId: { aulaId: id, alunoId: item.alunoId } },
          create: { aulaId: id, alunoId: item.alunoId, status: item.status },
          update: { status: item.status },
        }),
      ),
    );

    return this.prisma.frequencia.findMany({
      where: { aulaId: id },
      include: { aluno: { select: { id: true, nome: true, matricula: true } } },
    });
  }

  async override(id: string, dto: OverrideAulaDto) {
    // Ação exclusiva do admin (garantido pelo @Roles no controller) — não passa por posse de professor.
    const aula = await this.prisma.aula.findUnique({ where: { id } });
    if (!aula) {
      throw new NotFoundException('Aula não encontrada');
    }
    return this.prisma.aula.update({
      where: { id },
      data: { estadoOverride: dto.estado },
    });
  }
}
