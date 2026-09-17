import { ApiProperty } from '@nestjs/swagger';
import { StatusSolicitacaoFoto } from '../../../generated/prisma/client';

class SolicitacaoFotoAlunoResumoDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  nome: string;

  @ApiProperty()
  matricula: string;
}

export class SolicitacaoFotoDto {
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

  @ApiProperty({ type: SolicitacaoFotoAlunoResumoDto })
  aluno: SolicitacaoFotoAlunoResumoDto;
}
