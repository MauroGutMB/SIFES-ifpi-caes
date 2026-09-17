import { ApiProperty } from '@nestjs/swagger';
import { StatusFrequencia } from '../../../generated/prisma/client';
import { AulaDto } from './aula.dto';

class FrequenciaAlunoResumoDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  nome: string;

  @ApiProperty()
  matricula: string;
}

export class FrequenciaComAlunoDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  aulaId: string;

  @ApiProperty()
  alunoId: string;

  @ApiProperty({ enum: StatusFrequencia })
  status: StatusFrequencia;

  @ApiProperty({ type: FrequenciaAlunoResumoDto })
  aluno: FrequenciaAlunoResumoDto;
}

export class AulaDetalheDto extends AulaDto {
  @ApiProperty({ type: FrequenciaComAlunoDto, isArray: true })
  frequencias: FrequenciaComAlunoDto[];
}
