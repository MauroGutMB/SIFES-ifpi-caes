import { ApiProperty } from '@nestjs/swagger';
import { FormatoArquivo } from '../../../generated/prisma/client';

export class AtividadeDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  materiaId: string;

  @ApiProperty()
  titulo: string;

  @ApiProperty({ nullable: true, type: String })
  descricao: string | null;

  @ApiProperty({ enum: FormatoArquivo })
  formatoExigido: FormatoArquivo;

  @ApiProperty({ nullable: true, type: String })
  arquivoUrl: string | null;

  @ApiProperty({
    nullable: true,
    type: Date,
    description:
      'null só em atividades antigas, criadas antes do prazo ser obrigatório',
  })
  prazo: Date | null;

  @ApiProperty()
  criadaEm: Date;
}
