import { ApiProperty } from '@nestjs/swagger';
import { StatusSolicitacaoFoto } from '../../../generated/prisma/client';
import { AlunoResumoDto } from '../../common/aluno-resumo.dto';

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

  @ApiProperty({ type: AlunoResumoDto })
  aluno: AlunoResumoDto;
}
