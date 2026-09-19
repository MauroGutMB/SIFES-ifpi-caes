import { ApiProperty } from '@nestjs/swagger';
import { StatusSolicitacaoFoto } from '../../../generated/prisma/client';

export class MinhaSolicitacaoFotoDto {
  @ApiProperty({ description: 'ID da solicitação de troca de foto' })
  id: string;

  @ApiProperty({ description: 'ID do aluno que fez a solicitação' })
  alunoId: string;

  @ApiProperty({
    enum: StatusSolicitacaoFoto,
    description: 'Status atual da solicitação de troca de foto',
  })
  status: StatusSolicitacaoFoto;

  @ApiProperty({
    description: 'Data em que a solicitação foi criada',
    example: '2026-09-16T12:00:00.000Z',
  })
  criadaEm: Date;

  @ApiProperty({
    nullable: true,
    type: Date,
    description:
      'Data em que a solicitação foi aprovada ou rejeitada, ou null se ainda pendente',
  })
  resolvidaEm: Date | null;
}
