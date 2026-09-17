import { ApiProperty } from '@nestjs/swagger';

class EntregaAlunoResumoDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  nome: string;

  @ApiProperty()
  matricula: string;
}

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

  @ApiProperty({ type: EntregaAlunoResumoDto })
  aluno: EntregaAlunoResumoDto;
}
