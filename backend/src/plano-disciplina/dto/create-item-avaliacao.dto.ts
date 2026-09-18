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
  @ApiProperty({ example: 'Prova 1' })
  @IsString()
  @MinLength(1)
  nome: string;

  @ApiProperty({ example: 10 })
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
