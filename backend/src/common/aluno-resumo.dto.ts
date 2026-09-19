import { ApiProperty } from '@nestjs/swagger';

export class AlunoResumoDto {
  @ApiProperty({ description: 'Id do aluno' })
  id: string;

  @ApiProperty({ description: 'Nome completo do aluno' })
  nome: string;

  @ApiProperty({ description: 'Número de matrícula do aluno' })
  matricula: string;
}
