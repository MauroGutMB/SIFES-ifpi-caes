import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class CreateProfessorDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  nome: string;

  @ApiProperty({ description: 'Também usado como login' })
  @IsEmail()
  email: string;
}
