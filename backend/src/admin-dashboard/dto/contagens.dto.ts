import { ApiProperty } from '@nestjs/swagger';

class SemestreResumoDto {
  @ApiProperty({ description: 'Id do semestre' })
  id: string;

  @ApiProperty({ description: 'Nome do semestre', example: '2026.1' })
  nome: string;
}

export class ContagensDto {
  @ApiProperty({
    type: SemestreResumoDto,
    nullable: true,
    description:
      'Semestre cuja data atual está dentro do intervalo, ou null se não houver',
  })
  semestreAtual: SemestreResumoDto | null;

  @ApiProperty({ description: 'Total de professores cadastrados' })
  totalProfessores: number;

  @ApiProperty({ description: 'Total de alunos cadastrados' })
  totalAlunos: number;

  @ApiProperty({ description: 'Alunos sem turma vinculada no momento' })
  alunosSemTurma: number;

  @ApiProperty({
    description: 'Disciplinas vinculadas a turmas do semestre atual',
  })
  materiasSemestreAtual: number;

  @ApiProperty({ description: 'Alunos com alguma pendência em aberto' })
  alunosComPendencia: number;

  @ApiProperty({
    description: 'Solicitações de troca de foto aguardando aprovação',
  })
  fotosParaAprovar: number;
}
