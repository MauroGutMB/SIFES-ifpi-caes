import { ApiProperty } from '@nestjs/swagger';
import { DiaSemana, EstadoMateria } from '../../../generated/prisma/client';
import { TurmaResumoDto } from '../../turmas/dto/turma.dto';
import { ProfessorDto } from '../../professores/dto/professor.dto';

export class MateriaDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  turmaId: string;

  @ApiProperty()
  professorId: string;

  @ApiProperty()
  cargaHorariaReferencia: number;

  @ApiProperty({ enum: DiaSemana })
  diaSemana: DiaSemana;

  @ApiProperty()
  horaInicio: string;

  @ApiProperty({ enum: EstadoMateria })
  estado: EstadoMateria;

  @ApiProperty({ nullable: true, type: Date })
  encerradaEm: Date | null;

  @ApiProperty({ type: TurmaResumoDto })
  turma: TurmaResumoDto;

  @ApiProperty({ type: ProfessorDto })
  professor: ProfessorDto;
}
