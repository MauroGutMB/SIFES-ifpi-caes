import { ApiProperty } from '@nestjs/swagger';

export class AtividadesResumoMateriaDto {
  @ApiProperty()
  materiaId: string;

  @ApiProperty()
  materiaNome: string;

  @ApiProperty({ description: 'Atividades já entregues pelo aluno' })
  concluidas: number;

  @ApiProperty({ description: 'Sem entrega ainda, mas dentro do prazo' })
  pendentes: number;

  @ApiProperty({ description: 'Prazo vencido sem entrega' })
  vencidas: number;

  @ApiProperty()
  total: number;
}
