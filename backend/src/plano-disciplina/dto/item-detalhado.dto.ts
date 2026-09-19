import { ApiProperty } from '@nestjs/swagger';

export class ItemDetalhadoDto {
  @ApiProperty({ description: 'ID do item de avaliação' })
  id: string;

  @ApiProperty({ description: 'Nome do item de avaliação' })
  nome: string;

  @ApiProperty({ description: 'Decimal serializado como string', type: String })
  valorMaximo: string;

  @ApiProperty({ description: 'Decimal serializado como string', type: String })
  valorObtido: string;

  @ApiProperty({
    description:
      'false se a nota deste item nunca foi lançada (valorObtido é só um placeholder 0)',
  })
  notaLancada: boolean;

  @ApiProperty({
    description:
      'Indica se o item é especial, aplicado seletivamente a alunos abaixo da média',
  })
  especial: boolean;

  @ApiProperty({
    description:
      'Só relevante quando especial é true — se o item vale pra nota deste aluno',
  })
  habilitadoParaAluno: boolean;
}
