import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class CreateMaterialAulaDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  titulo: string;
}
