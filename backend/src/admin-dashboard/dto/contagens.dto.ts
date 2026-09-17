import { ApiProperty } from '@nestjs/swagger';

class SemestreResumoDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  nome: string;
}

export class ContagensDto {
  @ApiProperty({ type: SemestreResumoDto, nullable: true })
  semestreAtual: SemestreResumoDto | null;

  @ApiProperty()
  totalProfessores: number;

  @ApiProperty()
  totalAlunos: number;

  @ApiProperty()
  alunosSemTurma: number;

  @ApiProperty()
  materiasSemestreAtual: number;

  @ApiProperty()
  alunosComPendencia: number;
}
