import { ApiProperty } from '@nestjs/swagger';
import { ModoItemEspecial } from '../../../generated/prisma/client';

export class ItemAvaliacaoDto {
  @ApiProperty({ description: 'Identificador único do item de avaliação' })
  id: string;

  @ApiProperty({
    description: 'ID da disciplina (matéria) à qual o item pertence',
  })
  materiaId: string;

  @ApiProperty({ description: 'Nome do item de avaliação', example: 'Prova 1' })
  nome: string;

  @ApiProperty({ description: 'Decimal serializado como string', type: String })
  valorMaximo: string;

  @ApiProperty({ description: 'Decimal serializado como string', type: String })
  peso: string;

  @ApiProperty({
    description:
      'Indica se o item é especial, aplicado seletivamente a alunos abaixo da média',
  })
  especial: boolean;

  @ApiProperty({
    enum: ModoItemEspecial,
    nullable: true,
    description: 'Modo de aplicação do item especial, quando especial é true',
  })
  modoEspecial: ModoItemEspecial | null;

  @ApiProperty({
    nullable: true,
    type: String,
    description:
      'ID do item normal substituído por este item especial, quando aplicável',
  })
  itemSubstituidoId: string | null;
}
