import { ApiProperty } from '@nestjs/swagger';

export class LogsRemovidosDto {
  @ApiProperty({ description: 'Quantidade de registros de log removidos' })
  removidos: number;
}
