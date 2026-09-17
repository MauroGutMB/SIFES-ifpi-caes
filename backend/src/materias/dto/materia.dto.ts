import { ApiProperty } from '@nestjs/swagger';
import { DiaSemana, EstadoMateria } from '../../../generated/prisma/client';
import { TurmaResumoDto } from '../../turmas/dto/turma.dto';
import { ProfessorDto } from '../../professores/dto/professor.dto';

export class HorarioMateriaDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: DiaSemana })
  diaSemana: DiaSemana;

  @ApiProperty()
  horaInicio: string;
}

export class MateriaDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  nome: string;

  @ApiProperty()
  turmaId: string;

  @ApiProperty()
  professorId: string;

  @ApiProperty()
  cargaHorariaReferencia: number;

  @ApiProperty({ type: HorarioMateriaDto, isArray: true })
  horarios: HorarioMateriaDto[];

  @ApiProperty({ enum: EstadoMateria })
  estado: EstadoMateria;

  @ApiProperty({ nullable: true, type: Date })
  encerradaEm: Date | null;

  @ApiProperty({ type: TurmaResumoDto })
  turma: TurmaResumoDto;

  @ApiProperty({ type: ProfessorDto })
  professor: ProfessorDto;
}
