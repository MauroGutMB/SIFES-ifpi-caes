import {
  Controller,
  Get,
  ParseFilePipeBuilder,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { Role } from '../../generated/prisma/client';
import { FOTO_MIME_REGEX, MAX_FOTO_BYTES } from '../common/foto.util';
import { FotoSolicitacoesService } from './foto-solicitacoes.service';

@ApiTags('foto-solicitacoes')
@Roles(Role.ALUNO)
@Controller('users/me/foto/solicitacoes')
export class FotoSolicitacoesController {
  constructor(private readonly service: FotoSolicitacoesService) {}

  @Get()
  minhas(@CurrentUser() user: AuthenticatedUser) {
    return this.service.listarMinhas(user.alunoId!);
  }

  @Post()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('foto'))
  solicitar(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({ fileType: FOTO_MIME_REGEX })
        .addMaxSizeValidator({ maxSize: MAX_FOTO_BYTES })
        .build(),
    )
    file: Express.Multer.File,
  ) {
    return this.service.criar(user.alunoId!, file);
  }
}
