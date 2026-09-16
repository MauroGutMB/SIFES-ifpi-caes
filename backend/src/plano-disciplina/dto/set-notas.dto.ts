import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsNumber,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export class NotaItemDto {
  @ApiProperty()
  @IsUUID()
  alunoId: string;

  @ApiProperty({ example: 8.5 })
  @IsNumber()
  @Min(0)
  valorObtido: number;
}

export class SetNotasDto {
  @ApiProperty({ type: [NotaItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => NotaItemDto)
  notas: NotaItemDto[];
}
