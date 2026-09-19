import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsString, Matches } from 'class-validator';

export class CreateSemestreDto {
  @ApiProperty({
    example: '2026/1',
    description: 'Nome do semestre, no formato AAAA/1 ou AAAA/2',
  })
  @IsString()
  @Matches(/^\d{4}\/[12]$/, {
    message: 'nome deve seguir o formato AAAA/1 ou AAAA/2',
  })
  nome: string;

  @ApiProperty({
    example: '2026-02-01',
    description: 'Data de início do semestre, formato ISO (AAAA-MM-DD)',
  })
  @IsDateString()
  dataInicio: string;

  @ApiProperty({
    example: '2026-07-15',
    description: 'Data de término do semestre, formato ISO (AAAA-MM-DD)',
  })
  @IsDateString()
  dataFim: string;
}
