import { ApiProperty } from '@nestjs/swagger';
import { Turno } from '../../../generated/prisma/client';
import { SemestreDto } from '../../semestres/dto/semestre.dto';

export class TurmaResumoDto {
  @ApiProperty({ description: 'Id da turma' })
  id: string;

  @ApiProperty({ description: 'Id do semestre vinculado' })
  semestreId: string;

  @ApiProperty({ description: 'Curso técnico da turma' })
  cursoTecnico: string;

  @ApiProperty({ description: 'Ano/série da turma' })
  anoSerie: string;

  @ApiProperty({ enum: Turno, description: 'Turno da turma' })
  turno: Turno;
}

export class TurmaDto extends TurmaResumoDto {
  @ApiProperty({ type: SemestreDto, description: 'Semestre vinculado' })
  semestre: SemestreDto;
}
