import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { FormatoArquivo } from '../../../generated/prisma/client';

export class CreateAtividadeDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  titulo: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  descricao?: string;

  @ApiProperty({ enum: FormatoArquivo })
  @IsEnum(FormatoArquivo)
  formatoExigido: FormatoArquivo;
}
