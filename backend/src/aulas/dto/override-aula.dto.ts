import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { AulaEstadoOverride } from '../../../generated/prisma/client';

export class OverrideAulaDto {
  @ApiProperty({
    enum: AulaEstadoOverride,
    nullable: true,
    description:
      'null remove a sobreposição, voltando ao cálculo automático por horário',
  })
  @IsOptional()
  @IsEnum(AulaEstadoOverride)
  estado: AulaEstadoOverride | null;
}
