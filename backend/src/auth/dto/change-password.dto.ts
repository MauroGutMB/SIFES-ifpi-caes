import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({
    minLength: 6,
    description: 'Nova senha escolhida pelo usuário',
  })
  @IsString()
  @MinLength(6)
  novaSenha: string;
}
