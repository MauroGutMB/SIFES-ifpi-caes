import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSemestreDto } from './dto/create-semestre.dto';
import { UpdateSemestreDto } from './dto/update-semestre.dto';

@Injectable()
export class SemestresService {
  constructor(private readonly prisma: PrismaService) {}

  private validarDatas(dataInicio: string, dataFim: string) {
    if (new Date(dataFim) <= new Date(dataInicio)) {
      throw new BadRequestException('dataFim deve ser posterior a dataInicio');
    }
  }

  create(dto: CreateSemestreDto) {
    this.validarDatas(dto.dataInicio, dto.dataFim);
    return this.prisma.semestre.create({
      data: {
        nome: dto.nome,
        dataInicio: new Date(dto.dataInicio),
        dataFim: new Date(dto.dataFim),
      },
    });
  }

  findAll() {
    return this.prisma.semestre.findMany({ orderBy: { dataInicio: 'desc' } });
  }

  findOne(id: string) {
    return this.prisma.semestre.findUniqueOrThrow({ where: { id } });
  }

  async update(id: string, dto: UpdateSemestreDto) {
    const atual = await this.findOne(id);
    const dataInicio = dto.dataInicio ?? atual.dataInicio.toISOString();
    const dataFim = dto.dataFim ?? atual.dataFim.toISOString();
    this.validarDatas(dataInicio, dataFim);

    return this.prisma.semestre.update({
      where: { id },
      data: {
        nome: dto.nome,
        dataInicio: dto.dataInicio ? new Date(dto.dataInicio) : undefined,
        dataFim: dto.dataFim ? new Date(dto.dataFim) : undefined,
      },
    });
  }

  remove(id: string) {
    return this.prisma.semestre.delete({ where: { id } });
  }
}
