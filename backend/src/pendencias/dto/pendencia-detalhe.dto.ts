import { ApiProperty } from '@nestjs/swagger';

export class PendenciaDetalheDto {
  @ApiProperty({ description: 'ID da disciplina em que o aluno foi reprovado' })
  materiaId: string;

  @ApiProperty({
    description: 'Nome da disciplina em que o aluno foi reprovado',
  })
  materiaNome: string;

  @ApiProperty({
    description: 'Nome do semestre em que a disciplina foi cursada',
  })
  semestreNome: string;

  @ApiProperty({
    description: 'Nota final do aluno na disciplina',
    example: 4.5,
  })
  notaFinal: number;

  @ApiProperty({
    description: 'true se o admin já marcou essa pendência como vista',
  })
  resolvida: boolean;
}
