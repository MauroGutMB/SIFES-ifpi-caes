import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTurmaDto } from './dto/create-turma.dto';
import { UpdateTurmaDto } from './dto/update-turma.dto';

@Injectable()
export class TurmasService {
  constructor(private readonly prisma: PrismaService) {}

  private async validarSemestre(semestreId: string) {
    const semestre = await this.prisma.semestre.findUnique({
      where: { id: semestreId },
    });
    if (!semestre) {
      throw new NotFoundException('Semestre não encontrado');
    }
  }

  async create(dto: CreateTurmaDto) {
    await this.validarSemestre(dto.semestreId);
    return this.prisma.turma.create({ data: dto });
  }

  findAll(semestreId?: string) {
    return this.prisma.turma.findMany({
      where: semestreId ? { semestreId } : undefined,
      include: { semestre: true },
      orderBy: { anoSerie: 'asc' },
    });
  }

  findOne(id: string) {
    return this.prisma.turma.findUniqueOrThrow({
      where: { id },
      include: { semestre: true, materias: true },
    });
  }

  async update(id: string, dto: UpdateTurmaDto) {
    if (dto.semestreId) {
      await this.validarSemestre(dto.semestreId);
    }
    return this.prisma.turma.update({ where: { id }, data: dto });
  }

  remove(id: string) {
    return this.prisma.turma.delete({ where: { id } });
  }
}
