import { ApiProperty } from '@nestjs/swagger';

export class ResolverTodasDto {
  @ApiProperty({
    description:
      'Quantas pendências desse aluno foram marcadas como resolvidas',
  })
  resolvidas: number;

  @ApiProperty({
    required: false,
    description:
      'Nome do aluno cujas pendências foram resolvidas, quando informado',
  })
  alunoNome?: string;
}
