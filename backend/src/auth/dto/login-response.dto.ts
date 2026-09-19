import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../../../generated/prisma/client';

export class LoginResponseDto {
  @ApiProperty({
    description:
      'Token JWT de acesso, usado nas próximas requisições autenticadas',
  })
  accessToken: string;

  @ApiProperty({ enum: Role, description: 'Papel do usuário no sistema' })
  role: Role;

  @ApiProperty({
    description:
      'true quando o usuário ainda está com a senha inicial/temporária e deve trocá-la no próximo login',
  })
  precisaTrocarSenha: boolean;
}
