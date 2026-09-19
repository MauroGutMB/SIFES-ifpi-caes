import { ApiProperty } from '@nestjs/swagger';
import { AlunoResumoDto } from '../../common/aluno-resumo.dto';

export class EntregaDto {
  @ApiProperty({ description: 'ID da entrega' })
  id: string;

  @ApiProperty({ description: 'ID da atividade à qual a entrega pertence' })
  atividadeId: string;

  @ApiProperty({ description: 'ID do aluno que enviou a entrega' })
  alunoId: string;

  @ApiProperty({
    description: 'URL do arquivo enviado pelo aluno',
    example: 'https://storage.exemplo.com/entregas/arquivo.pdf',
  })
  arquivoUrl: string;

  @ApiProperty({
    description: 'Data e hora em que a entrega foi enviada',
    example: '2026-09-16T14:30:00.000Z',
  })
  enviadoEm: Date;

  @ApiProperty({
    type: AlunoResumoDto,
    description: 'Dados resumidos do aluno',
  })
  aluno: AlunoResumoDto;
}

export class MinhaEntregaDto {
  @ApiProperty({ description: 'ID da entrega' })
  id: string;

  @ApiProperty({ description: 'ID da atividade à qual a entrega pertence' })
  atividadeId: string;

  @ApiProperty({ description: 'ID do aluno que enviou a entrega' })
  alunoId: string;

  @ApiProperty({
    description: 'URL do arquivo enviado pelo aluno',
    example: 'https://storage.exemplo.com/entregas/arquivo.pdf',
  })
  arquivoUrl: string;

  @ApiProperty({
    description: 'Data e hora em que a entrega foi enviada',
    example: '2026-09-16T14:30:00.000Z',
  })
  enviadoEm: Date;
}
