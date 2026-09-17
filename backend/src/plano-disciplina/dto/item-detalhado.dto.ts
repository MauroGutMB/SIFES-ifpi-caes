import { ApiProperty } from '@nestjs/swagger';

export class ItemDetalhadoDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  nome: string;

  @ApiProperty({ description: 'Decimal serializado como string', type: String })
  valorMaximo: string;

  @ApiProperty({ description: 'Decimal serializado como string', type: String })
  valorObtido: string;
}
