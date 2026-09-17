import { ApiProperty } from '@nestjs/swagger';

class BoletimAlunoResumoDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  nome: string;

  @ApiProperty()
  matricula: string;
}

export class BoletimLinhaDto {
  @ApiProperty({ type: BoletimAlunoResumoDto })
  aluno: BoletimAlunoResumoDto;

  @ApiProperty()
  notaFinal: number;

  @ApiProperty()
  frequenciaPercentual: number;

  @ApiProperty({ enum: ['CURSANDO', 'APROVADO', 'REPROVADO'] })
  situacao: 'CURSANDO' | 'APROVADO' | 'REPROVADO';
}
