import { ApiProperty } from '@nestjs/swagger';

export class MaterialAulaDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  aulaId: string;

  @ApiProperty()
  titulo: string;

  @ApiProperty()
  arquivoUrl: string;

  @ApiProperty()
  postadoEm: Date;
}
