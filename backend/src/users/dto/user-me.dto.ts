import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../../../generated/prisma/client';

export class UserMeDto {
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
}
