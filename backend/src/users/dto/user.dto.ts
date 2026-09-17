import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../../../generated/prisma/client';

class ProfessorResumoDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  nome: string;
}

class AlunoResumoDto {
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

  @ApiProperty({ type: ProfessorResumoDto, nullable: true })
  professor: ProfessorResumoDto | null;

  @ApiProperty({ type: AlunoResumoDto, nullable: true })
  aluno: AlunoResumoDto | null;
}
