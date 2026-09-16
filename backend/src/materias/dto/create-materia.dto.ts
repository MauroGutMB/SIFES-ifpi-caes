import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsUUID, Matches, Min } from 'class-validator';
import { DiaSemana } from '../../../generated/prisma/client';

export class CreateMateriaDto {
  @ApiProperty()
  @IsUUID()
  turmaId: string;

  @ApiProperty()
  @IsUUID()
  professorId: string;

  @ApiProperty({
    example: 60,
    description: 'Carga horária de referência, em horas',
  })
  @IsInt()
  @Min(1)
  cargaHorariaReferencia: number;

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
