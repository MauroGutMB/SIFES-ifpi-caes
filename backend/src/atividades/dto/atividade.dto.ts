import { ApiProperty } from '@nestjs/swagger';
import { FormatoArquivo } from '../../../generated/prisma/client';

export class AtividadeDto {
  @ApiProperty({ description: 'ID da atividade' })
  id: string;

  @ApiProperty({
    description: 'ID da disciplina (matéria) a que a atividade pertence',
  })
  materiaId: string;

  @ApiProperty({ description: 'Título da atividade' })
  titulo: string;

  @ApiProperty({
    nullable: true,
    type: String,
    description: 'Descrição da atividade, se definida',
  })
  descricao: string | null;

  @ApiProperty({
    enum: FormatoArquivo,
    description: 'Formato de arquivo exigido para a entrega',
  })
  formatoExigido: FormatoArquivo;

  @ApiProperty({
    nullable: true,
    type: String,
    description: 'URL de um arquivo de apoio anexado à atividade, se houver',
  })
  arquivoUrl: string | null;

  @ApiProperty({
    nullable: true,
    type: Date,
    description:
      'null só em atividades antigas, criadas antes do prazo ser obrigatório',
  })
  prazo: Date | null;

  @ApiProperty({
    description: 'Data e hora de criação da atividade',
    example: '2026-09-16T10:00:00.000Z',
  })
  criadaEm: Date;
}
