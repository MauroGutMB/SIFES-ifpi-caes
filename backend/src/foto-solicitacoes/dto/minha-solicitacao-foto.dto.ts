import { ApiProperty } from '@nestjs/swagger';
import { StatusSolicitacaoFoto } from '../../../generated/prisma/client';

export class MinhaSolicitacaoFotoDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  alunoId: string;

  @ApiProperty({ enum: StatusSolicitacaoFoto })
  status: StatusSolicitacaoFoto;

  @ApiProperty()
  criadaEm: Date;

  @ApiProperty({ nullable: true, type: Date })
  resolvidaEm: Date | null;
}
