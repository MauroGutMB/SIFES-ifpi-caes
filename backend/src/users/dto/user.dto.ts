import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../../../generated/prisma/client';
import { AlunoResumoDto } from '../../common/aluno-resumo.dto';

class UserProfessorResumoDto {
  @ApiProperty({ description: 'Id do professor' })
  id: string;

  @ApiProperty({ description: 'Nome do professor' })
  nome: string;
}

class UserAlunoResumoDto extends AlunoResumoDto {
  @ApiProperty({
    nullable: true,
    type: String,
    description: 'Turma atual do aluno, ou null se estiver sem turma',
  })
  turmaId: string | null;
}

export class UserDto {
  @ApiProperty({ description: 'Id do usuário (conta de login)' })
  id: string;

  @ApiProperty({
    description: 'Login — matrícula (aluno) ou e-mail (professor/admin)',
    example: '20231234',
  })
  login: string;

  @ApiProperty({ enum: Role, description: 'Papel do usuário no sistema' })
  role: Role;

  @ApiProperty({
    description: 'Se o usuário precisa trocar a senha no próximo login',
  })
  precisaTrocarSenha: boolean;

  @ApiProperty({
    nullable: true,
    type: String,
    description: 'URL da foto de perfil, ou null se não tiver foto',
  })
  fotoUrl: string | null;

  @ApiProperty({ description: 'Data de criação da conta' })
  criadoEm: Date;

  @ApiProperty({
    type: UserProfessorResumoDto,
    nullable: true,
    description: 'Dados do professor vinculado, ou null se não for professor',
  })
  professor: UserProfessorResumoDto | null;

  @ApiProperty({
    type: UserAlunoResumoDto,
    nullable: true,
    description: 'Dados do aluno vinculado, ou null se não for aluno',
  })
  aluno: UserAlunoResumoDto | null;
}
