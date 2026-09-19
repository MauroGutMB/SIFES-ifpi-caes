import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class CreateItemAvaliacaoDto {
  @ApiProperty({
    description: 'Nome do item de avaliação',
    example: 'Prova 1',
  })
  @IsString()
  @MinLength(1)
  nome: string;

  @ApiProperty({
    description: 'Valor máximo (nota) que o item pode valer',
    example: 10,
  })
  @IsNumber()
  @Min(0.01)
  valorMaximo: number;

  @ApiProperty({
    required: false,
    description:
      'Item especial (recuperação, prova final) — só conta pros alunos habilitados individualmente, não pra turma inteira.',
  })
  @IsOptional()
  @IsBoolean()
  especial?: boolean;
}
