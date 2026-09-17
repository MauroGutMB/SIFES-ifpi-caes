import { ApiProperty } from '@nestjs/swagger';

export class ItemAvaliacaoDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  materiaId: string;

  @ApiProperty()
  nome: string;

  @ApiProperty({ description: 'Decimal serializado como string', type: String })
  valorMaximo: string;
}
