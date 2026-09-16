import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMateriaDto } from './dto/create-materia.dto';
import { UpdateMateriaDto } from './dto/update-materia.dto';
import { gerarOcorrenciasAula, validarHorarioNoTurno } from './horario.util';

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

  async create(dto: CreateMateriaDto) {
    const turma = await this.carregarTurmaComSemestre(dto.turmaId);
    await this.validarProfessor(dto.professorId);

    const erroHorario = validarHorarioNoTurno(dto.horaInicio, turma.turno);
    if (erroHorario) {
      throw new BadRequestException(erroHorario);
    }

    const ocorrencias = gerarOcorrenciasAula(
      turma.semestre.dataInicio,
      turma.semestre.dataFim,
      dto.diaSemana,
      dto.horaInicio,
    );

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

      if (ocorrencias.length > 0) {
        await tx.aula.createMany({
          data: ocorrencias.map((ocorrencia) => ({
            materiaId: materia.id,
            data: ocorrencia.data,
            horaInicio: ocorrencia.horaInicio,
            horaFim: ocorrencia.horaFim,
          })),
        });
      }

      return { ...materia, aulasGeradas: ocorrencias.length };
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
    const horarioMudou =
      dto.diaSemana !== undefined ||
      dto.horaInicio !== undefined ||
      dto.turmaId !== undefined;

    const erroHorario = validarHorarioNoTurno(horaInicio, turma.turno);
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

      if (horarioMudou) {
        await tx.aula.deleteMany({ where: { materiaId: id } });
        const ocorrencias = gerarOcorrenciasAula(
          turma.semestre.dataInicio,
          turma.semestre.dataFim,
          diaSemana,
          horaInicio,
        );
        if (ocorrencias.length > 0) {
          await tx.aula.createMany({
            data: ocorrencias.map((ocorrencia) => ({
              materiaId: id,
              data: ocorrencia.data,
              horaInicio: ocorrencia.horaInicio,
              horaFim: ocorrencia.horaFim,
            })),
          });
        }
      }

      return materia;
    });
  }

  remove(id: string) {
    return this.prisma.materia.delete({ where: { id } });
  }
}
