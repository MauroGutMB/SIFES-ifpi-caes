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

  @ApiProperty({ description: 'ID da aula à qual a frequência pertence' })
  aulaId: string;

  @ApiProperty({ description: 'ID do aluno' })
  alunoId: string;

  @ApiProperty({
    enum: StatusFrequencia,
    description: 'Situação do aluno na aula',
  })
  status: StatusFrequencia;

  @ApiProperty({
    type: AlunoResumoDto,
    description: 'Dados resumidos do aluno',
  })
  aluno: AlunoResumoDto;
}

export class AulaDetalheDto extends AulaDto {
  @ApiProperty({
    type: FrequenciaComAlunoDto,
    isArray: true,
    description: 'Frequências de cada aluno lançadas nesta aula',
  })
  frequencias: FrequenciaComAlunoDto[];
}
