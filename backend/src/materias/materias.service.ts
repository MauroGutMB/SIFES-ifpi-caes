import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EstadoMateria, Prisma, Role } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../auth/auth.types';
import { BoletimService } from '../boletim/boletim.service';
import { agoraComoBrasiliaFake } from '../common/tempo.util';
import { garantirPosseProfessor } from '../common/posse.util';
import { CreateMateriaDto } from './dto/create-materia.dto';
import { UpdateMateriaDto } from './dto/update-materia.dto';
import { gerarOcorrenciasAula, validarHorario } from './horario.util';

type Tx = Prisma.TransactionClient;

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

  /**
   * Alinha as Aulas de uma Matéria ao horário semanal + intervalo do Semestre atuais:
   * remove as que não têm mais data correspondente, cria as que faltam e atualiza o
   * horário das que continuam válidas — sem apagar/recriar o que não precisa mudar
   * (o Semestre é editável a qualquer momento pelo admin, e isso não pode destruir
   * lançamentos já feitos numa Aula que continua dentro do novo intervalo).
   */
  private async sincronizarAulas(
    tx: Tx,
    materiaId: string,
    dataInicioSemestre: Date,
    dataFimSemestre: Date,
    diaSemana: Parameters<typeof gerarOcorrenciasAula>[2],
    horaInicioStr: string,
  ) {
    const esperadas = gerarOcorrenciasAula(
      dataInicioSemestre,
      dataFimSemestre,
      diaSemana,
      horaInicioStr,
    );
    const esperadasPorData = new Map(
      esperadas.map((ocorrencia) => [
        this.dataKey(ocorrencia.data),
        ocorrencia,
      ]),
    );

    const existentes = await tx.aula.findMany({
      where: { materiaId },
      select: { id: true, data: true, horaInicio: true },
    });
    const existentesPorData = new Map(
      existentes.map((aula) => [this.dataKey(aula.data), aula]),
    );

    const idsRemover = existentes
      .filter((aula) => !esperadasPorData.has(this.dataKey(aula.data)))
      .map((aula) => aula.id);
    if (idsRemover.length > 0) {
      await tx.aula.deleteMany({ where: { id: { in: idsRemover } } });
    }

    const aCriar: {
      materiaId: string;
      data: Date;
      horaInicio: Date;
      horaFim: Date;
    }[] = [];
    for (const [dataStr, ocorrencia] of esperadasPorData) {
      const existente = existentesPorData.get(dataStr);
      if (!existente) {
        aCriar.push({
          materiaId,
          data: ocorrencia.data,
          horaInicio: ocorrencia.horaInicio,
          horaFim: ocorrencia.horaFim,
        });
      } else if (
        existente.horaInicio.getTime() !== ocorrencia.horaInicio.getTime()
      ) {
        await tx.aula.update({
          where: { id: existente.id },
          data: {
            horaInicio: ocorrencia.horaInicio,
            horaFim: ocorrencia.horaFim,
          },
        });
      }
    }
    if (aCriar.length > 0) {
      await tx.aula.createMany({ data: aCriar });
    }

    return { criadas: aCriar.length, removidas: idsRemover.length };
  }

  async create(dto: CreateMateriaDto) {
    const turma = await this.carregarTurmaComSemestre(dto.turmaId);
    await this.validarProfessor(dto.professorId);

    const erroHorario = validarHorario(dto.horaInicio);
    if (erroHorario) {
      throw new BadRequestException(erroHorario);
    }

    return this.prisma.$transaction(async (tx) => {
      const materia = await tx.materia.create({
        data: {
          turmaId: dto.turmaId,
          professorId: dto.professorId,
          cargaHorariaReferencia: dto.cargaHorariaReferencia,
          diaSemana: dto.diaSemana,
          horaInicio: dto.horaInicio,
        },
      });

      const sincronizado = await this.sincronizarAulas(
        tx,
        materia.id,
        turma.semestre.dataInicio,
        turma.semestre.dataFim,
        dto.diaSemana,
        dto.horaInicio,
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
      include: { turma: true, professor: true },
      orderBy: { diaSemana: 'asc' },
    });
  }

  findOne(id: string) {
    return this.prisma.materia.findUniqueOrThrow({
      where: { id },
      include: {
        turma: true,
        professor: true,
        _count: { select: { aulas: true, vinculos: true } },
      },
    });
  }

  async update(id: string, dto: UpdateMateriaDto) {
    const materiaAtual = await this.prisma.materia.findUniqueOrThrow({
      where: { id },
      include: { turma: { include: { semestre: true } } },
    });

    const turma = dto.turmaId
      ? await this.carregarTurmaComSemestre(dto.turmaId)
      : materiaAtual.turma;

    if (dto.professorId) {
      await this.validarProfessor(dto.professorId);
    }

    const diaSemana = dto.diaSemana ?? materiaAtual.diaSemana;
    const horaInicio = dto.horaInicio ?? materiaAtual.horaInicio;

    const erroHorario = validarHorario(horaInicio);
    if (erroHorario) {
      throw new BadRequestException(erroHorario);
    }

    return this.prisma.$transaction(async (tx) => {
      const materia = await tx.materia.update({
        where: { id },
        data: {
          turmaId: dto.turmaId,
          professorId: dto.professorId,
          cargaHorariaReferencia: dto.cargaHorariaReferencia,
          diaSemana: dto.diaSemana,
          horaInicio: dto.horaInicio,
        },
      });

      await this.sincronizarAulas(
        tx,
        id,
        turma.semestre.dataInicio,
        turma.semestre.dataFim,
        diaSemana,
        horaInicio,
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
            materia.diaSemana,
            materia.horaInicio,
          )),
        });
      }
      return resultados;
    });
  }
}
