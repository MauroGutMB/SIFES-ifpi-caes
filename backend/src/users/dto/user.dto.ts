import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../../../generated/prisma/client';

class UserProfessorResumoDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  nome: string;
}

class UserAlunoResumoDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  nome: string;

  @ApiProperty()
  matricula: string;

  @ApiProperty({ nullable: true, type: String })
  turmaId: string | null;
}

export class UserDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  login: string;

  @ApiProperty({ enum: Role })
  role: Role;

  @ApiProperty()
  precisaTrocarSenha: boolean;

  @ApiProperty({ nullable: true, type: String })
  fotoUrl: string | null;

  @ApiProperty()
  criadoEm: Date;

  @ApiProperty({ type: UserProfessorResumoDto, nullable: true })
  professor: UserProfessorResumoDto | null;

  @ApiProperty({ type: UserAlunoResumoDto, nullable: true })
  aluno: UserAlunoResumoDto | null;
}
