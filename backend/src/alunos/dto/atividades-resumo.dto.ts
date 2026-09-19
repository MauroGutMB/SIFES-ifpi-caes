import { ApiProperty } from '@nestjs/swagger';

export class AtividadesResumoMateriaDto {
  @ApiProperty({ description: 'Id da disciplina' })
  materiaId: string;

  @ApiProperty({ description: 'Nome da disciplina' })
  materiaNome: string;

  @ApiProperty({ description: 'Atividades já entregues pelo aluno' })
  concluidas: number;

  @ApiProperty({ description: 'Sem entrega ainda, mas dentro do prazo' })
  pendentes: number;

  @ApiProperty({ description: 'Prazo vencido sem entrega' })
  vencidas: number;

  @ApiProperty({ description: 'Total de atividades da disciplina' })
  total: number;
}
