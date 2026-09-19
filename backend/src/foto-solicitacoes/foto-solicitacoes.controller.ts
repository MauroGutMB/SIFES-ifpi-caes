import {
  Controller,
  Get,
  ParseFilePipeBuilder,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
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
import { FotoSolicitacoesService } from './foto-solicitacoes.service';
import { MinhaSolicitacaoFotoDto } from './dto/minha-solicitacao-foto.dto';
import { ApiAutenticado } from '../common/swagger-auth.decorator';

@ApiTags('foto-solicitacoes')
@Roles(Role.ALUNO)
@Controller('users/me/foto/solicitacoes')
@ApiAutenticado()
export class FotoSolicitacoesController {
  constructor(private readonly service: FotoSolicitacoesService) {}

  @Get()
  @ApiOperation({
    summary: 'Minhas solicitações de foto',
    description:
      'Lista as próprias solicitações de troca de foto de perfil do aluno autenticado.',
  })
  @ApiOkResponse({ type: MinhaSolicitacaoFotoDto, isArray: true })
  minhas(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<MinhaSolicitacaoFotoDto[]> {
    return this.service.listarMinhas(user.alunoId!);
  }

  @Post()
  @ApiOperation({
    summary: 'Solicitar troca de foto de perfil',
    description:
      'Cria uma solicitação de troca de foto, que fica PENDENTE até um admin aprovar ou rejeitar. Se já existir uma solicitação PENDENTE do aluno, o arquivo dela é substituído em vez de criar uma nova (o aluno está editando o que já enviou, não abrindo um pedido novo).',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['foto'],
      properties: { foto: { type: 'string', format: 'binary' } },
    },
  })
  @ApiBadRequestResponse({
    description:
      'Arquivo não é uma imagem válida (JPEG/PNG) ou excede o tamanho máximo',
  })
  @UseInterceptors(FileInterceptor('foto'))
  solicitar(
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
    return this.service.criar(user.alunoId!, file);
  }
}
