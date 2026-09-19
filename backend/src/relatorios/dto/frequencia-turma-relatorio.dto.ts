import { ApiProperty } from '@nestjs/swagger';
import { StatusFrequencia } from '../../../generated/prisma/client';

export class MateriaResumoRelatorioDto {
  @ApiProperty({ description: 'Id da disciplina' })
  id: string;

  @ApiProperty({ description: 'Nome da disciplina' })
  nome: string;
}

export class FrequenciaDetalheLinhaDto {
  @ApiProperty({ description: 'Id da aula' })
  aulaId: string;

  @ApiProperty({
    description: 'Data em que a aula ocorreu',
    example: '2026-05-12',
  })
  data: Date;

  @ApiProperty({ description: 'Id da disciplina da aula' })
  materiaId: string;

  @ApiProperty({ description: 'Nome da disciplina da aula' })
  materiaNome: string;

  @ApiProperty({ description: 'Id do aluno' })
  alunoId: string;

  @ApiProperty({ description: 'Nome do aluno' })
  alunoNome: string;

  @ApiProperty({ description: 'Número de matrícula do aluno' })
  matricula: string;

  @ApiProperty({
    enum: StatusFrequencia,
    description: 'Status de frequência do aluno nesta aula',
  })
  status: StatusFrequencia;
}

export class FrequenciaResumoLinhaDto {
  @ApiProperty({ description: 'Id do aluno' })
  alunoId: string;

  @ApiProperty({ description: 'Nome do aluno' })
  alunoNome: string;

  @ApiProperty({ description: 'Número de matrícula do aluno' })
  matricula: string;

  @ApiProperty({
    nullable: true,
    type: String,
    description: 'URL da foto do aluno, se houver',
  })
  fotoUrl: string | null;

  @ApiProperty({ description: 'Id da disciplina' })
  materiaId: string;

  @ApiProperty({ description: 'Nome da disciplina' })
  materiaNome: string;

  @ApiProperty({
    description: 'Percentual de frequência do aluno na disciplina',
    example: 87.5,
  })
  frequenciaPercentual: number;
}

export class RelatorioFrequenciaTurmaDto {
  @ApiProperty({
    type: MateriaResumoRelatorioDto,
    isArray: true,
    description: 'Disciplinas consideradas no relatório',
  })
  materias: MateriaResumoRelatorioDto[];

  @ApiProperty({
    type: FrequenciaResumoLinhaDto,
    isArray: true,
    description: 'Resumo de frequência por aluno e disciplina',
  })
  resumo: FrequenciaResumoLinhaDto[];

  @ApiProperty({
    type: FrequenciaDetalheLinhaDto,
    isArray: true,
    description: 'Detalhamento de frequência por aula e aluno',
  })
  detalhado: FrequenciaDetalheLinhaDto[];
}
