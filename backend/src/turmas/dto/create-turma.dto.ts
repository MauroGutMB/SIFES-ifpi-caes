import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, IsUUID } from 'class-validator';
import { Turno } from '../../../generated/prisma/client';

export class CreateTurmaDto {
  @ApiProperty({ description: 'Id do semestre ao qual a turma pertence' })
  @IsUUID()
  semestreId: string;

  @ApiProperty({ example: 'Informática' })
  @IsString()
  cursoTecnico: string;

  @ApiProperty({ example: '1º ano' })
  @IsString()
  anoSerie: string;

  @ApiProperty({ enum: Turno, description: 'Turno em que a turma acontece' })
  @IsEnum(Turno)
  turno: Turno;
}
