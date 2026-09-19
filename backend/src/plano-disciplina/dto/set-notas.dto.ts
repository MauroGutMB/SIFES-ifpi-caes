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
  @ApiProperty({ description: 'ID do aluno ao qual a nota será atribuída' })
  @IsUUID()
  alunoId: string;

  @ApiProperty({
    description: 'Nota obtida pelo aluno no item de avaliação',
    example: 8.5,
  })
  @IsNumber()
  @Min(0)
  valorObtido: number;
}

export class SetNotasDto {
  @ApiProperty({
    type: [NotaItemDto],
    description:
      'Lista de notas a serem lançadas para os alunos no item de avaliação',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => NotaItemDto)
  notas: NotaItemDto[];
}
