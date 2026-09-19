import { ApiProperty } from '@nestjs/swagger';
import { AlunoResumoDto } from '../../common/aluno-resumo.dto';

export class BoletimLinhaDto {
  @ApiProperty({ type: AlunoResumoDto })
  aluno: AlunoResumoDto;

  @ApiProperty({
    description:
      'Nota final do aluno na disciplina, calculada a partir dos itens de avaliação',
    example: 7.5,
  })
  notaFinal: number;

  @ApiProperty({
    description:
      'true se algum item que conta pra esse aluno ainda não teve nota lançada — a média pode mudar',
  })
  notaParcial: boolean;

  @ApiProperty({
    description: 'Percentual de frequência do aluno na disciplina',
    example: 85,
  })
  frequenciaPercentual: number;

  @ApiProperty({
    enum: ['CURSANDO', 'APROVADO', 'REPROVADO'],
    description: 'Situação atual do aluno na disciplina',
  })
  situacao: 'CURSANDO' | 'APROVADO' | 'REPROVADO';
}
