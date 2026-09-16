import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { StatusFrequencia } from '../../../generated/prisma/client';

export class FrequenciaItemDto {
  @ApiProperty()
  @IsUUID()
  alunoId: string;

  @ApiProperty({ enum: StatusFrequencia })
  @IsEnum(StatusFrequencia)
  status: StatusFrequencia;
}

export class SetFrequenciasDto {
  @ApiProperty({ type: [FrequenciaItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => FrequenciaItemDto)
  frequencias: FrequenciaItemDto[];
}
