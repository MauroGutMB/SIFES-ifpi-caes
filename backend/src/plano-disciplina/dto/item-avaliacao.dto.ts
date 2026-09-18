import { ApiProperty } from '@nestjs/swagger';
import { ModoItemEspecial } from '../../../generated/prisma/client';

export class ItemAvaliacaoDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  materiaId: string;

  @ApiProperty()
  nome: string;

  @ApiProperty({ description: 'Decimal serializado como string', type: String })
  valorMaximo: string;

  @ApiProperty({ description: 'Decimal serializado como string', type: String })
  peso: string;

  @ApiProperty()
  especial: boolean;

  @ApiProperty({ enum: ModoItemEspecial, nullable: true })
  modoEspecial: ModoItemEspecial | null;

  @ApiProperty({ nullable: true, type: String })
  itemSubstituidoId: string | null;
}
