import { ApiProperty } from '@nestjs/swagger';

export class DisciplinaDaTurmaDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  nome: string;

  @ApiProperty()
  professorId: string;

  @ApiProperty()
  professorNome: string;
}

export class ProfessorDaTurmaDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  nome: string;

  @ApiProperty({ nullable: true, type: String })
  fotoUrl: string | null;
}

export class AlunoDaTurmaDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  nome: string;

  @ApiProperty()
  matricula: string;

  @ApiProperty({ nullable: true, type: String })
  fotoUrl: string | null;
}

export class MinhaTurmaDetalheDto {
  @ApiProperty()
  cursoTecnico: string;

  @ApiProperty()
  anoSerie: string;

  @ApiProperty({ type: DisciplinaDaTurmaDto, isArray: true })
  disciplinas: DisciplinaDaTurmaDto[];

  @ApiProperty({ type: ProfessorDaTurmaDto, isArray: true })
  professores: ProfessorDaTurmaDto[];

  @ApiProperty({ type: AlunoDaTurmaDto, isArray: true })
  alunos: AlunoDaTurmaDto[];
}
