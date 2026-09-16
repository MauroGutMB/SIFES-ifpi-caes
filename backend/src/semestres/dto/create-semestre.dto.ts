import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsString, Matches } from 'class-validator';

export class CreateSemestreDto {
  @ApiProperty({ example: '2026/1' })
  @IsString()
  @Matches(/^\d{4}\/[12]$/, {
    message: 'nome deve seguir o formato AAAA/1 ou AAAA/2',
  })
  nome: string;

  @ApiProperty({ example: '2026-02-01' })
  @IsDateString()
  dataInicio: string;

  @ApiProperty({ example: '2026-07-15' })
  @IsDateString()
  dataFim: string;
}
