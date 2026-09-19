import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class CreateProfessorDto {
  @ApiProperty({ description: 'Nome completo do professor' })
  @IsString()
  @MinLength(1)
  nome: string;

  @ApiProperty({ description: 'Também usado como login' })
  @IsEmail()
  email: string;
}
