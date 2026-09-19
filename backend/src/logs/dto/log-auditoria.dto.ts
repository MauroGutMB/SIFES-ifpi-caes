import { ApiProperty } from '@nestjs/swagger';

export class LogAuditoriaDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  acao: string;

  @ApiProperty()
  alvo: string;

  @ApiProperty()
  usuarioNome: string;

  @ApiProperty({ required: false, nullable: true })
  semestreId: string | null;

  @ApiProperty()
  criadoEm: Date;
}
