import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class VincularTurmaDto {
  @ApiProperty()
  @IsUUID()
  turmaId: string;
}
