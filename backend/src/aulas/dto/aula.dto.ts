import { ApiProperty } from '@nestjs/swagger';
import { AulaEstadoOverride } from '../../../generated/prisma/client';

export class AulaDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  materiaId: string;

  @ApiProperty()
  data: Date;

  @ApiProperty()
  horaInicio: Date;

  @ApiProperty()
  horaFim: Date;

  @ApiProperty({ nullable: true, type: String })
  titulo: string | null;

  @ApiProperty({ nullable: true, type: String })
  descricao: string | null;

  @ApiProperty({ enum: AulaEstadoOverride, nullable: true })
  estadoOverride: AulaEstadoOverride | null;

  @ApiProperty({ enum: ['LANCADO', 'NAO_LANCADO'] })
  estado: 'LANCADO' | 'NAO_LANCADO';
}
