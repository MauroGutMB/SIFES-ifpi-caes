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
  @ApiProperty({
    description: 'ID do aluno cuja frequência está sendo lançada',
  })
  @IsUUID()
  alunoId: string;

  @ApiProperty({
    enum: StatusFrequencia,
    description: 'Situação do aluno na aula',
  })
  @IsEnum(StatusFrequencia)
  status: StatusFrequencia;
}

export class SetFrequenciasDto {
  @ApiProperty({
    type: [FrequenciaItemDto],
    description: 'Lista de frequências a lançar para a aula',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => FrequenciaItemDto)
  frequencias: FrequenciaItemDto[];
}
