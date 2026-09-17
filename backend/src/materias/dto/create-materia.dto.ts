import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsInt,
  IsString,
  IsUUID,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { HorarioMateriaInputDto } from './horario-materia.dto';

export class CreateMateriaDto {
  @ApiProperty({ example: 'Matemática' })
  @IsString()
  @MinLength(1)
  nome: string;

  @ApiProperty()
  @IsUUID()
  turmaId: string;

  @ApiProperty()
  @IsUUID()
  professorId: string;

  @ApiProperty({
    example: 60,
    description: 'Carga horária de referência, em horas',
  })
  @IsInt()
  @Min(1)
  cargaHorariaReferencia: number;

  @ApiProperty({
    type: HorarioMateriaInputDto,
    isArray: true,
    description:
      'Slots semanais recorrentes — a Matéria pode se encontrar mais de uma vez por semana',
  })
  @ValidateNested({ each: true })
  @Type(() => HorarioMateriaInputDto)
  @ArrayMinSize(1)
  horarios: HorarioMateriaInputDto[];
}
