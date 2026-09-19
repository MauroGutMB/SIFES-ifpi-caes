import { ApiProperty } from '@nestjs/swagger';

export class AtividadePendenteDto {
  @ApiProperty({ description: 'Id da atividade' })
  id: string;

  @ApiProperty({ description: 'Título da atividade' })
  titulo: string;

  @ApiProperty({
    nullable: true,
    type: Date,
    description: 'Prazo de entrega, ou null se não tiver prazo definido',
  })
  prazo: Date | null;

  @ApiProperty({ description: 'Id da disciplina da atividade' })
  materiaId: string;

  @ApiProperty({ description: 'Nome da disciplina da atividade' })
  materiaNome: string;
}
