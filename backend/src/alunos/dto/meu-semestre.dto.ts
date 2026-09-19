import { ApiProperty } from '@nestjs/swagger';
import { Turno } from '../../../generated/prisma/client';

class SemestreResumoDto {
  @ApiProperty({ description: 'Id do semestre' })
  id: string;

  @ApiProperty({ description: 'Nome do semestre', example: '2026.1' })
  nome: string;

  @ApiProperty({ description: 'Data de início do semestre' })
  dataInicio: Date;

  @ApiProperty({ description: 'Data de término do semestre' })
  dataFim: Date;
}

class TurmaResumoMeuSemestreDto {
  @ApiProperty({ description: 'Curso técnico da turma' })
  cursoTecnico: string;

  @ApiProperty({ description: 'Ano/série da turma' })
  anoSerie: string;

  @ApiProperty({ enum: Turno, description: 'Turno da turma' })
  turno: Turno;
}

export class MeuSemestreDto {
  @ApiProperty({
    type: SemestreResumoDto,
    description: 'Dados do semestre letivo',
  })
  semestre: SemestreResumoDto;

  @ApiProperty({
    type: TurmaResumoMeuSemestreDto,
    description: 'Turma do aluno naquele semestre',
  })
  turma: TurmaResumoMeuSemestreDto;

  @ApiProperty({ description: 'Se é o semestre da turma atual do aluno' })
  atual: boolean;

  @ApiProperty({
    description: 'Total de disciplinas vinculadas nesse semestre',
  })
  totalMaterias: number;

  @ApiProperty({ description: 'Disciplinas em que o aluno foi aprovado' })
  aprovadas: number;

  @ApiProperty({ description: 'Disciplinas em que o aluno foi reprovado' })
  reprovadas: number;

  @ApiProperty({
    description: 'Disciplinas ainda em curso (sem resultado final)',
  })
  cursando: number;
}
