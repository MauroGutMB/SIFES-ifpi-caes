import {
  Controller,
  Delete,
  Get,
  Param,
  ParseFilePipeBuilder,
  Post,
  Put,
  Query,
  Res,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { Role } from '../../generated/prisma/client';
import {
  FOTO_MIME_REGEX,
  FOTO_MIME_TIPOS,
  MAX_FOTO_BYTES,
} from '../common/foto.util';
import { FileSignatureValidationPipe } from '../common/file-signature-validation.pipe';
import { UsersService } from './users.service';
import { UserMeDto } from './dto/user-me.dto';
import { UserDto } from './dto/user.dto';
import { SenhaRedefinidaDto } from './dto/senha-redefinida.dto';
import { ImportarUsuariosResultadoDto } from './dto/importar-usuarios-resultado.dto';
import { LogAcao } from '../logs/log-acao.decorator';
import { ApiAutenticado } from '../common/swagger-auth.decorator';

const MAX_IMPORTACAO_BYTES = 2 * 1024 * 1024; // 2MB — bem além do que uma lista de nomes precisa

@ApiTags('users')
@Controller('users')
@ApiAutenticado()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Roles(Role.ADMIN)
  @Get()
  @ApiOperation({
    summary: 'Lista usuários',
    description:
      'Retorna todos os usuários (contas de login), com o resumo do aluno ou professor vinculado. Restrito ao admin. Filtra por papel (role) via query, se informado.',
  })
  @ApiOkResponse({ type: UserDto, isArray: true })
  findAll(@Query('role') role?: Role): Promise<UserDto[]> {
    return this.usersService.findAll(role);
  }

  @Get('me')
  @ApiOperation({
    summary: 'Meus dados de login',
    description:
      'Retorna os dados da própria conta do usuário autenticado (login, papel, foto, se precisa trocar a senha).',
  })
  @ApiOkResponse({ type: UserMeDto })
  me(@CurrentUser() user: AuthenticatedUser): Promise<UserMeDto> {
    return this.usersService.findMe(user.id);
  }

  // Aluno troca a foto por solicitação — ver FotoSolicitacoesModule.
  @Roles(Role.ADMIN, Role.PROFESSOR)
  @Post('me/foto')
  @ApiOperation({
    summary: 'Troca a própria foto',
    description:
      'Substitui a foto de perfil do usuário autenticado. Só admin e professor podem trocar direto — aluno precisa abrir uma solicitação de troca de foto (ver FotoSolicitacoesModule), que passa por aprovação.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['foto'],
      properties: { foto: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(FileInterceptor('foto'))
  updateFoto(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({ fileType: FOTO_MIME_REGEX })
        .addMaxSizeValidator({ maxSize: MAX_FOTO_BYTES })
        .build(),
      new FileSignatureValidationPipe(FOTO_MIME_TIPOS),
    )
    file: Express.Multer.File,
  ) {
    return this.usersService.updateFotoFromUpload(user.id, file);
  }

  @Roles(Role.ADMIN)
  @Delete(':id/foto')
  @ApiOperation({
    summary: 'Remove a foto de um usuário',
    description:
      'Apaga a foto de perfil de qualquer usuário (aluno ou professor). Restrito ao admin.',
  })
  @ApiNotFoundResponse({ description: 'Usuário não encontrado' })
  @LogAcao(({ resultado }) => ({
    acao: 'Removeu foto de usuário',
    alvo: (resultado as { nome?: string })?.nome ?? 'usuário',
  }))
  removerFoto(@Param('id') id: string) {
    return this.usersService.removerFoto(id);
  }

  @Roles(Role.ADMIN)
  @Put(':id/redefinir-senha')
  @ApiOperation({
    summary: 'Redefine a senha do usuário',
    description:
      'Gera uma nova senha temporária para o usuário e o obriga a trocá-la no próximo login. Revoga todas as sessões ativas (refresh tokens) dele. Restrito ao admin.',
  })
  @ApiOkResponse({ type: SenhaRedefinidaDto })
  @ApiNotFoundResponse({ description: 'Usuário não encontrado' })
  @LogAcao(({ resultado }) => ({
    acao: 'Redefiniu senha',
    alvo: (resultado as { login?: string })?.login ?? 'usuário',
  }))
  redefinirSenha(@Param('id') id: string): Promise<SenhaRedefinidaDto> {
    return this.usersService.resetarSenha(id);
  }

  @Roles(Role.ADMIN)
  @Get('modelo-importacao')
  @ApiOperation({
    summary: 'Baixa modelo de importação',
    description:
      'Retorna um CSV modelo (colunas nome,login,cargo) para a importação em lote de alunos e professores. Restrito ao admin.',
  })
  modeloImportacao(@Res({ passthrough: true }) res: Response): StreamableFile {
    res.set({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition':
        'attachment; filename="modelo-importacao-usuarios.csv"',
    });
    return new StreamableFile(this.usersService.gerarModeloImportacao());
  }

  @Roles(Role.ADMIN)
  @Post('importar')
  @ApiOperation({
    summary: 'Importa usuários via CSV',
    description:
      'Cria alunos e professores em lote a partir de um CSV (nome,login,cargo). Idempotente: linhas com login já existente são apenas puladas (não duplicam nem falham), e linhas malformadas são ignoradas individualmente e relatadas em erros. Restrito ao admin.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['arquivo'],
      properties: { arquivo: { type: 'string', format: 'binary' } },
    },
  })
  @ApiOkResponse({ type: ImportarUsuariosResultadoDto })
  @UseInterceptors(FileInterceptor('arquivo'))
  @LogAcao(({ resultado }) => ({
    acao: 'Importou usuários via CSV',
    alvo: `${(resultado as { importados?: unknown[] })?.importados?.length ?? 0} usuário(s) importado(s)`,
  }))
  importar(
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addMaxSizeValidator({ maxSize: MAX_IMPORTACAO_BYTES })
        .build(),
    )
    arquivo: Express.Multer.File,
  ): Promise<ImportarUsuariosResultadoDto> {
    return this.usersService.importarUsuarios(arquivo.buffer);
  }
}
