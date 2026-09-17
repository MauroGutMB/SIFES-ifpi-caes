import { ApiProperty } from '@nestjs/swagger';
import { AlunoResumoDto } from '../../common/aluno-resumo.dto';

export class BoletimLinhaDto {
  @ApiProperty({ type: AlunoResumoDto })
  aluno: AlunoResumoDto;

  @ApiProperty()
  notaFinal: number;

  @ApiProperty()
  frequenciaPercentual: number;

  @ApiProperty({ enum: ['CURSANDO', 'APROVADO', 'REPROVADO'] })
  situacao: 'CURSANDO' | 'APROVADO' | 'REPROVADO';
}
