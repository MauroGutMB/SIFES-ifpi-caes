import { ApiProperty } from '@nestjs/swagger';

export class UsuarioImportadoDto {
  @ApiProperty({
    description: 'Linha do CSV (1 = cabeçalho, dados começam na 2)',
  })
  linha: number;

  @ApiProperty()
  nome: string;

  @ApiProperty()
  login: string;

  @ApiProperty({ enum: ['ALUNO', 'PROFESSOR'] })
  cargo: string;

  @ApiProperty({
    description: 'Senha inicial gerada — mostrar ao admin uma única vez',
  })
  senhaInicial: string;
}

export class ErroImportacaoDto {
  @ApiProperty({ description: 'Linha do CSV onde o erro ocorreu' })
  linha: number;

  @ApiProperty()
  motivo: string;
}

export class ImportarUsuariosResultadoDto {
  @ApiProperty({ type: UsuarioImportadoDto, isArray: true })
  importados: UsuarioImportadoDto[];

  @ApiProperty({ type: ErroImportacaoDto, isArray: true })
  erros: ErroImportacaoDto[];
}
