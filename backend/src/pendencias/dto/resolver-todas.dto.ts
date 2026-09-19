import { ApiProperty } from '@nestjs/swagger';

export class ResolverTodasDto {
  @ApiProperty({
    description:
      'Quantas pendências desse aluno foram marcadas como resolvidas',
  })
  resolvidas: number;
}
