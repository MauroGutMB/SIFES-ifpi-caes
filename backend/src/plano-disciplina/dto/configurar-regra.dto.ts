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
}

export class ConfigurarRegraDto {
  @ApiProperty({ type: [ConfiguracaoItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ConfiguracaoItemDto)
  itens: ConfiguracaoItemDto[];

  @ApiProperty({
    required: false,
    description:
      'Média mínima (0-10) pra aprovação na disciplina — fora da lista de itens, vale pra disciplina inteira. Padrão 7 se nunca configurada.',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  notaMinimaAprovacao?: number;
}
