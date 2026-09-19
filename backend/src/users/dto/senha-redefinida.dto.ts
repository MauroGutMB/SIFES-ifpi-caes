import { ApiProperty } from '@nestjs/swagger';

export class SenhaRedefinidaDto {
  @ApiProperty({ description: 'Login do usuário que teve a senha redefinida' })
  login: string;

  @ApiProperty({
    description:
      'Nova senha temporária gerada — mostrar ao admin uma única vez',
  })
  senhaInicial: string;
}
