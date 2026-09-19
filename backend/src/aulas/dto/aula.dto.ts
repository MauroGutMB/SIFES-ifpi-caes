import { ApiProperty } from '@nestjs/swagger';
import { AulaEstadoOverride } from '../../../generated/prisma/client';

export class AulaDto {
  @ApiProperty({ description: 'ID da aula' })
  id: string;

  @ApiProperty({
    description: 'ID da disciplina (matéria) a que a aula pertence',
  })
  materiaId: string;

  @ApiProperty({
    description: 'Data em que a aula ocorre',
    example: '2026-09-16',
  })
  data: Date;

  @ApiProperty({
    description: 'Horário de início da aula',
    example: '2026-09-16T08:00:00.000Z',
  })
  horaInicio: Date;

  @ApiProperty({
    description: 'Horário de término da aula',
    example: '2026-09-16T09:40:00.000Z',
  })
  horaFim: Date;

  @ApiProperty({
    nullable: true,
    type: String,
    description: 'Título da aula, se definido',
  })
  titulo: string | null;

  @ApiProperty({
    nullable: true,
    type: String,
    description: 'Descrição da aula, se definida',
  })
  descricao: string | null;

  @ApiProperty({
    enum: AulaEstadoOverride,
    nullable: true,
    description:
      'Estado da aula sobrescrito manualmente por um admin, se houver',
  })
  estadoOverride: AulaEstadoOverride | null;

  @ApiProperty({
    enum: ['LANCADO', 'NAO_LANCADO'],
    description:
      'Estado calculado da aula: se as frequências já foram lançadas ou não',
  })
  estado: 'LANCADO' | 'NAO_LANCADO';
}
