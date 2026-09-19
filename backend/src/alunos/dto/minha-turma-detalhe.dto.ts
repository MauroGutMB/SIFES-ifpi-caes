import { ApiProperty } from '@nestjs/swagger';

export class DisciplinaDaTurmaDto {
  @ApiProperty({ description: 'Id da disciplina' })
  id: string;

  @ApiProperty({ description: 'Nome da disciplina' })
  nome: string;

  @ApiProperty({ description: 'Id do professor responsável' })
  professorId: string;

  @ApiProperty({ description: 'Nome do professor responsável' })
  professorNome: string;
}

export class ProfessorDaTurmaDto {
  @ApiProperty({ description: 'Id do professor' })
  id: string;

  @ApiProperty({ description: 'Nome do professor' })
  nome: string;

  @ApiProperty({
    nullable: true,
    type: String,
    description: 'URL da foto de perfil, ou null se não tiver foto',
  })
  fotoUrl: string | null;
}

export class AlunoDaTurmaDto {
  @ApiProperty({ description: 'Id do aluno' })
  id: string;

  @ApiProperty({ description: 'Nome do aluno' })
  nome: string;

  @ApiProperty({ description: 'Matrícula do aluno' })
  matricula: string;

  @ApiProperty({
    nullable: true,
    type: String,
    description: 'URL da foto de perfil, ou null se não tiver foto',
  })
  fotoUrl: string | null;
}

export class MinhaTurmaDetalheDto {
  @ApiProperty({ description: 'Curso técnico da turma' })
  cursoTecnico: string;

  @ApiProperty({ description: 'Ano/série da turma' })
  anoSerie: string;

  @ApiProperty({ type: DisciplinaDaTurmaDto, isArray: true })
  disciplinas: DisciplinaDaTurmaDto[];

  @ApiProperty({
    type: ProfessorDaTurmaDto,
    isArray: true,
    description: 'Professores das disciplinas da turma, sem repetição',
  })
  professores: ProfessorDaTurmaDto[];

  @ApiProperty({
    type: AlunoDaTurmaDto,
    isArray: true,
    description: 'Colegas de turma',
  })
  alunos: AlunoDaTurmaDto[];
}
