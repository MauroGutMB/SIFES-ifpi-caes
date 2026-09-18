import { ApiProperty } from '@nestjs/swagger';

export class AplicarAbaixoMediaDto {
  @ApiProperty({ description: 'Quantos alunos tiveram o item habilitado' })
  alunosHabilitados: number;
}
