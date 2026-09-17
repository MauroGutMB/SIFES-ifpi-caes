import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  DiaSemana,
  EstadoMateria,
  Prisma,
  Role,
} from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../auth/auth.types';
import { BoletimService } from '../boletim/boletim.service';
import { agoraComoBrasiliaFake } from '../common/tempo.util';
import { garantirPosseProfessor } from '../common/posse.util';
import { CreateMateriaDto } from './dto/create-materia.dto';
import { UpdateMateriaDto } from './dto/update-materia.dto';
import { gerarOcorrenciasAula, validarHorario } from './horario.util';

type Tx = Prisma.TransactionClient;
type Horario = { diaSemana: DiaSemana; horaInicio: string };

@Injectable()
export class MateriasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly boletim: BoletimService,
  ) {}

  private async carregarTurmaComSemestre(turmaId: string) {
    const turma = await this.prisma.turma.findUnique({
      where: { id: turmaId },
      include: { semestre: true },
    });
    if (!turma) {
      throw new NotFoundException('Turma não encontrada');
    }
    return turma;
  }

  private async validarProfessor(professorId: string) {
    const professor = await this.prisma.professor.findUnique({
      where: { id: professorId },
    });
    if (!professor) {
      throw new NotFoundException('Professor não encontrado');
    }
  }

  private dataKey(data: Date): string {
    return data.toISOString().slice(0, 10);
  }

  private validarHorarios(horarios: Horario[]) {
    for (const horario of horarios) {
      const erro = validarHorario(horario.horaInicio);
      if (erro) {
        throw new BadRequestException(erro);
      }
    }
  }

  /**
   * Dentro de uma mesma Turma, dois slots com o mesmo dia+horário não podem pertencer a
   * Matérias diferentes — a Turma (seus alunos) não pode estar em duas aulas ao mesmo tempo.
   */
  private async validarConflitosDeHorario(
    turmaId: string,
    materiaId: string | null,
    horarios: Horario[],
  ) {
    for (const horario of horarios) {
      const conflito = await this.prisma.horarioMateria.findFirst({
        where: {
          diaSemana: horario.diaSemana,
          horaInicio: horario.horaInicio,
          materia: {
            turmaId,
            id: materiaId ? { not: materiaId } : undefined,
          },
        },
        include: { materia: true },
      });
      if (conflito) {
        throw new BadRequestException(
          `Conflito de horário: a turma já tem "${conflito.materia.nome}" em ` +
            `${horario.diaSemana} às ${horario.horaInicio}`,
        );
      }
    }
  }

  /**
   * Alinha as Aulas de uma Matéria aos seus slots semanais + intervalo do Semestre atuais:
   * remove as que não têm mais ocorrência correspondente, cria as que faltam e atualiza o
   * horário das que continuam válidas — sem apagar/recriar o que não precisa mudar (o Semestre
   * é editável a qualquer momento pelo admin, e isso não pode destruir lançamentos já feitos
   * numa Aula que continua válida). Casadas por data + posição na lista de ocorrências do dia,
   * já que uma Matéria pode ter mais de um slot no mesmo dia da semana.
   */
  private async sincronizarAulas(
    tx: Tx,
    materiaId: string,
    dataInicioSemestre: Date,
    dataFimSemestre: Date,
    horarios: Horario[],
  ) {
    const esperadas = horarios.flatMap((horario) =>
      gerarOcorrenciasAula(
        dataInicioSemestre,
        dataFimSemestre,
        horario.diaSemana,
        horario.horaInicio,
      ),
    );
    const esperadasPorDia = new Map<string, typeof esperadas>();
    for (const ocorrencia of esperadas) {
      const chave = this.dataKey(ocorrencia.data);
      const lista = esperadasPorDia.get(chave) ?? [];
      lista.push(ocorrencia);
      esperadasPorDia.set(chave, lista);
    }
    for (const lista of esperadasPorDia.values()) {
      lista.sort((a, b) => a.horaInicio.getTime() - b.horaInicio.getTime());
    }

    const existentes = await tx.aula.findMany({
      where: { materiaId },
      orderBy: { horaInicio: 'asc' },
      select: { id: true, data: true, horaInicio: true },
    });
    const existentesPorDia = new Map<string, typeof existentes>();
    for (const aula of existentes) {
      const chave = this.dataKey(aula.data);
      const lista = existentesPorDia.get(chave) ?? [];
      lista.push(aula);
      existentesPorDia.set(chave, lista);
    }

    let criadas = 0;
    let removidas = 0;
    const todosOsDias = new Set([
      ...esperadasPorDia.keys(),
      ...existentesPorDia.keys(),
    ]);

    for (const dia of todosOsDias) {
      const esperadasNoDia = esperadasPorDia.get(dia) ?? [];
      const existentesNoDia = existentesPorDia.get(dia) ?? [];
      const max = Math.max(esperadasNoDia.length, existentesNoDia.length);

      for (let i = 0; i < max; i++) {
        const esperada = esperadasNoDia[i];
        const existente = existentesNoDia[i];

        if (esperada && existente) {
          if (
            existente.horaInicio.getTime() !== esperada.horaInicio.getTime()
          ) {
            await tx.aula.update({
              where: { id: existente.id },
              data: {
                horaInicio: esperada.horaInicio,
                horaFim: esperada.horaFim,
              },
            });
          }
        } else if (esperada && !existente) {
          await tx.aula.create({
            data: {
              materiaId,
              data: esperada.data,
              horaInicio: esperada.horaInicio,
              horaFim: esperada.horaFim,
            },
          });
          criadas++;
        } else if (!esperada && existente) {
          await tx.aula.delete({ where: { id: existente.id } });
          removidas++;
        }
      }
    }

    return { criadas, removidas };
  }

  async create(dto: CreateMateriaDto) {
    const turma = await this.carregarTurmaComSemestre(dto.turmaId);
    await this.validarProfessor(dto.professorId);
    this.validarHorarios(dto.horarios);
    await this.validarConflitosDeHorario(dto.turmaId, null, dto.horarios);

    return this.prisma.$transaction(async (tx) => {
      const materia = await tx.materia.create({
        data: {
          nome: dto.nome,
          turmaId: dto.turmaId,
          professorId: dto.professorId,
          cargaHorariaReferencia: dto.cargaHorariaReferencia,
          horarios: { createMany: { data: dto.horarios } },
        },
      });

      const sincronizado = await this.sincronizarAulas(
        tx,
        materia.id,
        turma.semestre.dataInicio,
        turma.semestre.dataFim,
        dto.horarios,
      );

      return { ...materia, aulasGeradas: sincronizado.criadas };
    });
  }

  findAll(filtros: {
    turmaId?: string;
    professorId?: string;
    vinculadoAlunoId?: string;
  }) {
    return this.prisma.materia.findMany({
      where: {
        turmaId: filtros.turmaId,
        professorId: filtros.professorId,
        vinculos: filtros.vinculadoAlunoId
          ? { some: { alunoId: filtros.vinculadoAlunoId } }
          : undefined,
      },
      include: { turma: true, professor: true, horarios: true },
      orderBy: { nome: 'asc' },
    });
  }

  findOne(id: string) {
    return this.prisma.materia.findUniqueOrThrow({
      where: { id },
      include: {
        turma: true,
        professor: true,
        horarios: true,
        _count: { select: { aulas: true, vinculos: true } },
      },
    });
  }

  async update(id: string, dto: UpdateMateriaDto) {
    const materiaAtual = await this.prisma.materia.findUniqueOrThrow({
      where: { id },
      include: { turma: { include: { semestre: true } }, horarios: true },
    });

    const turma = dto.turmaId
      ? await this.carregarTurmaComSemestre(dto.turmaId)
      : materiaAtual.turma;

    if (dto.professorId) {
      await this.validarProfessor(dto.professorId);
    }

    const horarios: Horario[] =
      dto.horarios ??
      materiaAtual.horarios.map((h) => ({
        diaSemana: h.diaSemana,
        horaInicio: h.horaInicio,
      }));
    this.validarHorarios(horarios);

    if (dto.horarios || dto.turmaId) {
      await this.validarConflitosDeHorario(turma.id, id, horarios);
    }

    return this.prisma.$transaction(async (tx) => {
      const materia = await tx.materia.update({
        where: { id },
        data: {
          nome: dto.nome,
          turmaId: dto.turmaId,
          professorId: dto.professorId,
          cargaHorariaReferencia: dto.cargaHorariaReferencia,
        },
      });

      if (dto.horarios) {
        await tx.horarioMateria.deleteMany({ where: { materiaId: id } });
        await tx.horarioMateria.createMany({
          data: dto.horarios.map((h) => ({ ...h, materiaId: id })),
        });
      }

      await this.sincronizarAulas(
        tx,
        id,
        turma.semestre.dataInicio,
        turma.semestre.dataFim,
        horarios,
      );

      return materia;
    });
  }

  remove(id: string) {
    return this.prisma.materia.delete({ where: { id } });
  }

  async encerrar(id: string, user: AuthenticatedUser) {
    const materia = await this.prisma.materia.findUnique({
      where: { id },
      include: { turma: { include: { semestre: true } } },
    });
    if (!materia) {
      throw new NotFoundException('Matéria não encontrada');
    }
    garantirPosseProfessor(user, materia.professorId, 'Matéria não encontrada');
    if (materia.estado === EstadoMateria.ENCERRADA) {
      throw new BadRequestException('Matéria já está encerrada');
    }
    // Professor só encerra após o fim do Semestre; admin pode a qualquer momento (override).
    if (user.role === Role.PROFESSOR) {
      const agora = agoraComoBrasiliaFake();
      if (agora < materia.turma.semestre.dataFim) {
        throw new BadRequestException(
          'Só é possível encerrar a Matéria após o fim do Semestre',
        );
      }
    }

    const atualizada = await this.prisma.materia.update({
      where: { id },
      data: { estado: EstadoMateria.ENCERRADA, encerradaEm: new Date() },
    });

    const vinculos = await this.prisma.vinculoAlunoMateria.findMany({
      where: { materiaId: id },
      select: { alunoId: true },
    });
    for (const { alunoId } of vinculos) {
      await this.verificarDesligamentoAutomatico(alunoId);
    }

    return atualizada;
  }

  /** Admin reabre uma Matéria já encerrada (correção). */
  async reabrir(id: string) {
    const materia = await this.prisma.materia.findUnique({ where: { id } });
    if (!materia) {
      throw new NotFoundException('Matéria não encontrada');
    }
    return this.prisma.materia.update({
      where: { id },
      data: { estado: EstadoMateria.ABERTA, encerradaEm: null },
    });
  }

  /**
   * Um semestre só é concluído pro aluno quando todas as Matérias vinculadas da sua turma
   * atual estiverem encerradas. Aprovado em tudo → desliga automaticamente (fica sem turma,
   * livre pra ser matriculado em outra). Reprovado em alguma → fica pendente, vinculado até
   * o admin agir manualmente (ver regras-negocio.md — Pendência e desligamento do semestre).
   */
  private async verificarDesligamentoAutomatico(alunoId: string) {
    const aluno = await this.prisma.aluno.findUnique({
      where: { id: alunoId },
    });
    if (!aluno?.turmaId) return;

    const vinculos = await this.prisma.vinculoAlunoMateria.findMany({
      where: { alunoId },
      include: { materia: true },
    });
    const vinculosDaTurmaAtual = vinculos.filter(
      (v) => v.materia.turmaId === aluno.turmaId,
    );
    if (vinculosDaTurmaAtual.length === 0) return;

    const todasEncerradas = vinculosDaTurmaAtual.every(
      (v) => v.materia.estado === EstadoMateria.ENCERRADA,
    );
    if (!todasEncerradas) return;

    for (const vinculo of vinculosDaTurmaAtual) {
      const boletim = await this.boletim.calcularBoletimMateria(
        vinculo.materiaId,
      );
      const linha = boletim.find((b) => b.aluno.id === alunoId);
      if (!linha || linha.situacao !== 'APROVADO') {
        return; // reprovado em alguma: fica pendente, sem ação automática
      }
    }

    await this.prisma.aluno.update({
      where: { id: alunoId },
      data: { turmaId: null },
    });
  }

  /**
   * Reajusta as Aulas de todas as Matérias de um Semestre às suas datas atuais —
   * chamado sempre que o admin edita dataInicio/dataFim do Semestre, já que ele é
   * editável a qualquer momento e serve como referência, não como regra fixa.
   */
  async regenerarAulasPorSemestre(semestreId: string) {
    const semestre = await this.prisma.semestre.findUniqueOrThrow({
      where: { id: semestreId },
    });
    const materias = await this.prisma.materia.findMany({
      where: { turma: { semestreId } },
      include: { horarios: true },
    });

    return this.prisma.$transaction(async (tx) => {
      const resultados: {
        materiaId: string;
        criadas: number;
        removidas: number;
      }[] = [];
      for (const materia of materias) {
        resultados.push({
          materiaId: materia.id,
          ...(await this.sincronizarAulas(
            tx,
            materia.id,
            semestre.dataInicio,
            semestre.dataFim,
            materia.horarios,
          )),
        });
      }
      return resultados;
    });
  }
}
