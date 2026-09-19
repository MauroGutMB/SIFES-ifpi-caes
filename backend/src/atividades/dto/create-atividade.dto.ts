import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { FormatoArquivo } from '../../../generated/prisma/client';

export class CreateAtividadeDto {
  @ApiProperty({ description: 'Título da atividade' })
  @IsString()
  @MinLength(1)
  titulo: string;

  @ApiProperty({ required: false, description: 'Descrição da atividade' })
  @IsOptional()
  @IsString()
  descricao?: string;

  @ApiProperty({
    enum: FormatoArquivo,
    description: 'Formato de arquivo exigido para a entrega',
  })
  @IsEnum(FormatoArquivo)
  formatoExigido: FormatoArquivo;

  @ApiProperty({ description: 'Data/hora limite para entrega, ISO 8601' })
  @IsDateString()
  prazo: string;
}
