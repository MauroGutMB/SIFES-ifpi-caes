import { ApiProperty } from '@nestjs/swagger';
import { StatusFrequencia } from '../../../generated/prisma/client';

export class MateriaResumoRelatorioDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  nome: string;
}

export class FrequenciaDetalheLinhaDto {
  @ApiProperty()
  data: Date;

  @ApiProperty()
  materiaId: string;

  @ApiProperty()
  materiaNome: string;

  @ApiProperty()
  alunoId: string;

  @ApiProperty()
  alunoNome: string;

  @ApiProperty()
  matricula: string;

  @ApiProperty({ enum: StatusFrequencia })
  status: StatusFrequencia;
}

export class FrequenciaResumoLinhaDto {
  @ApiProperty()
  alunoId: string;

  @ApiProperty()
  alunoNome: string;

  @ApiProperty()
  matricula: string;

  @ApiProperty()
  materiaId: string;

  @ApiProperty()
  materiaNome: string;

  @ApiProperty()
  frequenciaPercentual: number;
}

export class RelatorioFrequenciaTurmaDto {
  @ApiProperty({ type: MateriaResumoRelatorioDto, isArray: true })
  materias: MateriaResumoRelatorioDto[];

  @ApiProperty({ type: FrequenciaResumoLinhaDto, isArray: true })
  resumo: FrequenciaResumoLinhaDto[];

  @ApiProperty({ type: FrequenciaDetalheLinhaDto, isArray: true })
  detalhado: FrequenciaDetalheLinhaDto[];
}
