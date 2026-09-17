import { ApiProperty } from '@nestjs/swagger';
import { AlunoResumoDto } from '../../common/aluno-resumo.dto';

export class EntregaDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  atividadeId: string;

  @ApiProperty()
  alunoId: string;

  @ApiProperty()
  arquivoUrl: string;

  @ApiProperty()
  enviadoEm: Date;

  @ApiProperty({ type: AlunoResumoDto })
  aluno: AlunoResumoDto;
}

export class MinhaEntregaDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  atividadeId: string;

  @ApiProperty()
  alunoId: string;

  @ApiProperty()
  arquivoUrl: string;

  @ApiProperty()
  enviadoEm: Date;
}
