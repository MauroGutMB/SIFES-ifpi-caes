import { ApiProperty } from '@nestjs/swagger';
import { Turno } from '../../../generated/prisma/client';

class SemestreResumoDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  nome: string;

  @ApiProperty()
  dataInicio: Date;

  @ApiProperty()
  dataFim: Date;
}

class TurmaResumoMeuSemestreDto {
  @ApiProperty()
  cursoTecnico: string;

  @ApiProperty()
  anoSerie: string;

  @ApiProperty({ enum: Turno })
  turno: Turno;
}

export class MeuSemestreDto {
  @ApiProperty({ type: SemestreResumoDto })
  semestre: SemestreResumoDto;

  @ApiProperty({ type: TurmaResumoMeuSemestreDto })
  turma: TurmaResumoMeuSemestreDto;

  @ApiProperty({ description: 'Se é o semestre da turma atual do aluno' })
  atual: boolean;

  @ApiProperty()
  totalMaterias: number;

  @ApiProperty()
  aprovadas: number;

  @ApiProperty()
  reprovadas: number;

  @ApiProperty()
  cursando: number;
}
