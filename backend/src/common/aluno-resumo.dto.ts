import { ApiProperty } from '@nestjs/swagger';

export class AlunoResumoDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  nome: string;

  @ApiProperty()
  matricula: string;
}
