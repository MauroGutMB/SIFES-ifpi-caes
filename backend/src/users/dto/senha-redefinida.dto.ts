import { ApiProperty } from '@nestjs/swagger';

export class SenhaRedefinidaDto {
  @ApiProperty()
  login: string;

  @ApiProperty({
    description:
      'Nova senha temporária gerada — mostrar ao admin uma única vez',
  })
  senhaInicial: string;
}
