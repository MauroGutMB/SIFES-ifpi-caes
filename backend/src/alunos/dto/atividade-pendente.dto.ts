import { ApiProperty } from '@nestjs/swagger';

export class AtividadePendenteDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  titulo: string;

  @ApiProperty({ nullable: true, type: Date })
  prazo: Date | null;

  @ApiProperty()
  materiaId: string;

  @ApiProperty()
  materiaNome: string;
}
