import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, IsUUID } from 'class-validator';
import { Turno } from '../../../generated/prisma/client';

export class CreateTurmaDto {
  @ApiProperty()
  @IsUUID()
  semestreId: string;

  @ApiProperty({ example: 'Informática' })
  @IsString()
  cursoTecnico: string;

  @ApiProperty({ example: '1º ano' })
  @IsString()
  anoSerie: string;

  @ApiProperty({ enum: Turno })
  @IsEnum(Turno)
  turno: Turno;
}
