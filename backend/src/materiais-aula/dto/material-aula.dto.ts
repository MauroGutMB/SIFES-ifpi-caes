import { ApiProperty } from '@nestjs/swagger';

export class MaterialAulaDto {
  @ApiProperty({ description: 'ID do material de aula' })
  id: string;

  @ApiProperty({ description: 'ID da aula à qual o material pertence' })
  aulaId: string;

  @ApiProperty({ description: 'Título do material' })
  titulo: string;

  @ApiProperty({
    description: 'URL do arquivo do material (slide, apostila, foto, etc.)',
    example: 'https://storage.exemplo.com/materiais/slide.pdf',
  })
  arquivoUrl: string;

  @ApiProperty({
    description: 'Data e hora em que o material foi postado',
    example: '2026-09-16T10:00:00.000Z',
  })
  postadoEm: Date;
}
