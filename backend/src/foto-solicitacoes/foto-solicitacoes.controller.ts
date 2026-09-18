import {
  Controller,
  Get,
  ParseFilePipeBuilder,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOkResponse, ApiTags } from '@nestjs/swagger';
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

@ApiTags('foto-solicitacoes')
@Roles(Role.ALUNO)
@Controller('users/me/foto/solicitacoes')
export class FotoSolicitacoesController {
  constructor(private readonly service: FotoSolicitacoesService) {}

  @Get()
  @ApiOkResponse({ type: MinhaSolicitacaoFotoDto, isArray: true })
  minhas(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<MinhaSolicitacaoFotoDto[]> {
    return this.service.listarMinhas(user.alunoId!);
  }

  @Post()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['foto'],
      properties: { foto: { type: 'string', format: 'binary' } },
    },
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
