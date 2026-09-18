import { ApiProperty } from '@nestjs/swagger';
import { AlunoResumoDto } from '../../common/aluno-resumo.dto';

export class BoletimLinhaDto {
  @ApiProperty({ type: AlunoResumoDto })
  aluno: AlunoResumoDto;

  @ApiProperty()
  notaFinal: number;

  @ApiProperty({
    description:
      'true se algum item que conta pra esse aluno ainda não teve nota lançada — a média pode mudar',
  })
  notaParcial: boolean;

  @ApiProperty()
  frequenciaPercentual: number;

  @ApiProperty({ enum: ['CURSANDO', 'APROVADO', 'REPROVADO'] })
  situacao: 'CURSANDO' | 'APROVADO' | 'REPROVADO';
}
