import { ApiProperty } from '@nestjs/swagger';
import { DiaSemana, EstadoMateria } from '../../../generated/prisma/client';
import { TurmaResumoDto } from '../../turmas/dto/turma.dto';
import { ProfessorDto } from '../../professores/dto/professor.dto';

export class HorarioMateriaDto {
  @ApiProperty({ description: 'Id do horário' })
  id: string;

  @ApiProperty({ enum: DiaSemana, description: 'Dia da semana da aula' })
  diaSemana: DiaSemana;

  @ApiProperty({ description: 'Horário de início da aula', example: '08:00' })
  horaInicio: string;
}

export class MateriaDto {
  @ApiProperty({ description: 'Id da disciplina' })
  id: string;

  @ApiProperty({ description: 'Nome da disciplina' })
  nome: string;

  @ApiProperty({ description: 'Id da turma vinculada' })
  turmaId: string;

  @ApiProperty({ description: 'Id do professor responsável' })
  professorId: string;

  @ApiProperty({ description: 'Carga horária de referência, em horas' })
  cargaHorariaReferencia: number;

  @ApiProperty({
    type: HorarioMateriaDto,
    isArray: true,
    description: 'Horários semanais recorrentes da disciplina',
  })
  horarios: HorarioMateriaDto[];

  @ApiProperty({
    enum: EstadoMateria,
    description: 'Estado atual da disciplina',
  })
  estado: EstadoMateria;

  @ApiProperty({
    nullable: true,
    type: Date,
    description: 'Data em que a disciplina foi encerrada, se já encerrada',
  })
  encerradaEm: Date | null;

  @ApiProperty({
    description:
      'Decimal serializado como string — média mínima pra aprovação, padrão 7',
    type: String,
  })
  notaMinimaAprovacao: string;

  @ApiProperty({
    type: TurmaResumoDto,
    description: 'Turma vinculada à disciplina',
  })
  turma: TurmaResumoDto;

  @ApiProperty({
    type: ProfessorDto,
    description: 'Professor responsável pela disciplina',
  })
  professor: ProfessorDto;
}
