import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class CreateMaterialAulaDto {
  @ApiProperty({ description: 'Título do material de aula' })
  @IsString()
  @MinLength(1)
  titulo: string;
}
