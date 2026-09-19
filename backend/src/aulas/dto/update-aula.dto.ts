import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateAulaDto {
  @ApiProperty({ required: false, description: 'Novo título da aula' })
  @IsOptional()
  @IsString()
  titulo?: string;

  @ApiProperty({ required: false, description: 'Nova descrição da aula' })
  @IsOptional()
  @IsString()
  descricao?: string;
}
