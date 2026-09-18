import { ApiProperty } from '@nestjs/swagger';

export class PendenciaAlunoDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  nome: string;

  @ApiProperty()
  matricula: string;

  @ApiProperty({ nullable: true, type: String })
  fotoUrl: string | null;

  @ApiProperty({
    description: 'Quantas disciplinas encerradas com reprovação, nesse status',
  })
  totalPendencias: number;
}
