import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../../../generated/prisma/client';

export class UserMeDto {
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
}
