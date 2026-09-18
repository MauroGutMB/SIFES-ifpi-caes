import { ApiProperty } from '@nestjs/swagger';

export class PendenciaDetalheDto {
  @ApiProperty()
  materiaId: string;

  @ApiProperty()
  materiaNome: string;

  @ApiProperty()
  semestreNome: string;

  @ApiProperty()
  notaFinal: number;

  @ApiProperty({
    description: 'true se o admin já marcou essa pendência como vista',
  })
  resolvida: boolean;
}
