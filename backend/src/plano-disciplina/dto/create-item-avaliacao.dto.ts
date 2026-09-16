import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, Min, MinLength } from 'class-validator';

export class CreateItemAvaliacaoDto {
  @ApiProperty({ example: 'Prova 1' })
  @IsString()
  @MinLength(1)
  nome: string;

  @ApiProperty({ example: 10 })
  @IsNumber()
  @Min(0.01)
  valorMaximo: number;
}
