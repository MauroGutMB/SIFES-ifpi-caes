import { ApiProperty } from '@nestjs/swagger';
import { StatusFrequencia } from '../../../generated/prisma/client';
import { AlunoResumoDto } from '../../common/aluno-resumo.dto';
import { AulaDto } from './aula.dto';

export class FrequenciaComAlunoDto {
  @ApiProperty({
    nullable: true,
    type: String,
    description: 'null quando a frequência ainda não foi lançada',
  })
  id: string | null;

  @ApiProperty()
  aulaId: string;

  @ApiProperty()
  alunoId: string;

  @ApiProperty({ enum: StatusFrequencia })
  status: StatusFrequencia;

  @ApiProperty({ type: AlunoResumoDto })
  aluno: AlunoResumoDto;
}

export class AulaDetalheDto extends AulaDto {
  @ApiProperty({ type: FrequenciaComAlunoDto, isArray: true })
  frequencias: FrequenciaComAlunoDto[];
}
