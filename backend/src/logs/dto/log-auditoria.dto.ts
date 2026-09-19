import { ApiProperty } from '@nestjs/swagger';

export class LogAuditoriaDto {
  @ApiProperty({ description: 'ID do registro de auditoria' })
  id: string;

  @ApiProperty({
    description:
      'Ação administrativa realizada (ex.: APROVAR_FOTO, RESOLVER_PENDENCIA)',
  })
  acao: string;

  @ApiProperty({
    description:
      'Identificador ou descrição do alvo da ação (ex.: aluno, disciplina)',
  })
  alvo: string;

  @ApiProperty({
    description: 'Nome do usuário (administrador) que realizou a ação',
  })
  usuarioNome: string;

  @ApiProperty({
    required: false,
    nullable: true,
    description: 'ID do semestre relacionado à ação, quando aplicável',
  })
  semestreId: string | null;

  @ApiProperty({
    description: 'Data e hora em que a ação foi registrada',
    example: '2026-09-16T12:00:00.000Z',
  })
  criadoEm: Date;
}
