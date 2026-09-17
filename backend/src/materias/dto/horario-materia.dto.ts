import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, Matches } from 'class-validator';
import { DiaSemana } from '../../../generated/prisma/client';

export class HorarioMateriaInputDto {
  @ApiProperty({ enum: DiaSemana })
  @IsEnum(DiaSemana)
  diaSemana: DiaSemana;

  @ApiProperty({
    example: '08:00',
    description: 'Horário de início, formato HH:mm',
  })
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
  horaInicio: string;
}
