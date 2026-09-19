import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'Login: matrícula (aluno), e-mail/usuário (professor/admin)',
  })
  @IsString()
  login: string;

  @ApiProperty({ description: 'Senha do usuário' })
  @IsString()
  @MinLength(1)
  senha: string;
}
