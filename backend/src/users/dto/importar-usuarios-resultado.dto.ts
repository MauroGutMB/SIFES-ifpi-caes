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

export class IgnoradoImportacaoDto {
  @ApiProperty({ description: 'Linha do CSV que foi pulada' })
  linha: number;

  @ApiProperty()
  nome: string;

  @ApiProperty()
  login: string;

  @ApiProperty({
    description: 'Motivo de a linha ter sido pulada (ex: login já existe)',
  })
  motivo: string;
}

export class ImportarUsuariosResultadoDto {
  @ApiProperty({ type: UsuarioImportadoDto, isArray: true })
  importados: UsuarioImportadoDto[];

  @ApiProperty({
    type: ErroImportacaoDto,
    isArray: true,
    description: 'Linhas malformadas — não foram inseridas',
  })
  erros: ErroImportacaoDto[];

  @ApiProperty({
    type: IgnoradoImportacaoDto,
    isArray: true,
    description:
      'Linhas válidas mas puladas por já existir um usuário com esse login',
  })
  ignorados: IgnoradoImportacaoDto[];
}
