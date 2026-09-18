import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { ModoItemEspecial } from '../../../generated/prisma/client';

export class ConfiguracaoItemDto {
  @ApiProperty()
  @IsUUID()
  itemAvaliacaoId: string;

  @ApiProperty({ description: 'Peso do item na média ponderada da disciplina' })
  @IsNumber()
  @Min(0.01)
  peso: number;

  @ApiProperty({
    enum: ModoItemEspecial,
    required: false,
    description: 'Só se aplica a itens especiais',
  })
  @IsOptional()
  @IsEnum(ModoItemEspecial)
  modoEspecial?: ModoItemEspecial;

  @ApiProperty({
    required: false,
    description:
      'Item normal substituído — só quando modoEspecial = SUBSTITUI_ITEM',
  })
  @IsOptional()
  @IsUUID()
  itemSubstituidoId?: string;

  @ApiProperty({
    required: false,
    description:
      'Nota mínima (0-10, já normalizada) que o item especial precisa atingir pra valer — abaixo disso é ignorado no cálculo',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  notaMetaMinima?: number;
}

export class ConfigurarRegraDto {
  @ApiProperty({ type: [ConfiguracaoItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ConfiguracaoItemDto)
  itens: ConfiguracaoItemDto[];
}
