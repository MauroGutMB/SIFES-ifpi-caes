import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateAulaDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  titulo?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  descricao?: string;
}
