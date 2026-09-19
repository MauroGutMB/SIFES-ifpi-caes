import { ApiProperty } from '@nestjs/swagger';

export class LogsRemovidosDto {
  @ApiProperty()
  removidos: number;
}
