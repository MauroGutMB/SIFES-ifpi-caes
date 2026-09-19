import { ApiProperty } from '@nestjs/swagger';

export class SemestreDto {
  @ApiProperty({ description: 'Id do semestre' })
  id: string;

  @ApiProperty({ description: 'Nome do semestre', example: '2026.1' })
  nome: string;

  @ApiProperty({ description: 'Data de início do semestre' })
  dataInicio: Date;

  @ApiProperty({ description: 'Data de término do semestre' })
  dataFim: Date;
}
