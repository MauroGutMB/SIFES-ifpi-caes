import { ApiProperty } from '@nestjs/swagger';

export class RefreshResponseDto {
  @ApiProperty({
    description: 'Novo token JWT de acesso, gerado a partir do refresh token',
  })
  accessToken: string;
}
