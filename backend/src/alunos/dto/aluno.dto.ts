import { ApiProperty } from '@nestjs/swagger';
import { TurmaDto } from '../../turmas/dto/turma.dto';

export class AlunoDto {
  @ApiProperty({ description: 'Id do aluno' })
  id: string;

  @ApiProperty({ description: 'Id da conta de login (User) vinculada' })
  userId: string;

  @ApiProperty({
    description: 'Nome completo do aluno',
    example: 'Maria da Silva',
  })
  nome: string;

  @ApiProperty({
    description: 'Matrícula — também usada como login',
    example: '20231234',
  })
  matricula: string;

  @ApiProperty({
    nullable: true,
    type: String,
    description: 'Turma atual do aluno, ou null se estiver sem turma',
  })
  turmaId: string | null;

  @ApiProperty({
    nullable: true,
    type: String,
    description: 'URL da foto de perfil, ou null se não tiver foto',
  })
  fotoUrl: string | null;
}

export class AlunoCriadoDto extends AlunoDto {
  @ApiProperty({
    description: 'Senha inicial gerada — mostrar ao admin uma única vez',
  })
  senhaInicial: string;
}

export class AlunoMeDto extends AlunoDto {
  @ApiProperty({ type: TurmaDto, nullable: true })
  turma: TurmaDto | null;
}
