import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class CreateAlunoDto {
  @ApiProperty({
    description: 'Nome completo do aluno',
    example: 'Maria da Silva',
  })
  @IsString()
  @MinLength(1)
  nome: string;

  @ApiProperty({ description: 'Número de matrícula, também usado como login' })
  @IsString()
  @MinLength(1)
  matricula: string;
}
