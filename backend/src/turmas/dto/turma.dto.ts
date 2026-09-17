import { ApiProperty } from '@nestjs/swagger';
import { Turno } from '../../../generated/prisma/client';
import { SemestreDto } from '../../semestres/dto/semestre.dto';

export class TurmaResumoDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  semestreId: string;

  @ApiProperty()
  cursoTecnico: string;

  @ApiProperty()
  anoSerie: string;

  @ApiProperty({ enum: Turno })
  turno: Turno;
}

export class TurmaDto extends TurmaResumoDto {
  @ApiProperty({ type: SemestreDto })
  semestre: SemestreDto;
}
