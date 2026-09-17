import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../../../generated/prisma/client';

export class LoginResponseDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty({ enum: Role })
  role: Role;

  @ApiProperty()
  precisaTrocarSenha: boolean;
}
