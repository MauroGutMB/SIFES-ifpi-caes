import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMateriaDto } from './dto/create-materia.dto';
import { UpdateMateriaDto } from './dto/update-materia.dto';
import { gerarOcorrenciasAula, validarHorario } from './horario.util';

type Tx = Prisma.TransactionClient;

@Injectable()
export class MateriasService {
  constructor(private readonly prisma: PrismaService) {}

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

  findAll(filtros: { turmaId?: string; professorId?: string }) {
    return this.prisma.materia.findMany({
      where: {
        turmaId: filtros.turmaId,
        professorId: filtros.professorId,
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
