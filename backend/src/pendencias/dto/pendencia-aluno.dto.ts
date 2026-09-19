import { ApiProperty } from '@nestjs/swagger';

export class PendenciaAlunoDto {
  @ApiProperty({ description: 'ID do aluno' })
  id: string;

  @ApiProperty({ description: 'Nome do aluno' })
  nome: string;

  @ApiProperty({ description: 'Número de matrícula do aluno' })
  matricula: string;

  @ApiProperty({
    nullable: true,
    type: String,
    description: 'URL da foto de perfil do aluno, ou null se não houver foto',
  })
  fotoUrl: string | null;

  @ApiProperty({
    description: 'Quantas disciplinas encerradas com reprovação, nesse status',
  })
  totalPendencias: number;
}
