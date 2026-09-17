import { ApiProperty } from '@nestjs/swagger';

export class SemestreDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  nome: string;

  @ApiProperty()
  dataInicio: Date;

  @ApiProperty()
  dataFim: Date;
}
