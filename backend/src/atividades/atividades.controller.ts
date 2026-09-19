import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseFilePipeBuilder,
  Patch,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { Role } from '../../generated/prisma/client';
import { LogAcao } from '../logs/log-acao.decorator';
import { AtividadesService } from './atividades.service';
import { UpdateAtividadeDto } from './dto/update-atividade.dto';
import { EntregaDto } from './dto/entrega.dto';
import { MAX_ENTREGA_BYTES } from './formato-entrega.util';

@ApiTags('atividades')
@Roles(Role.ADMIN, Role.PROFESSOR)
@Controller('atividades')
export class AtividadesController {
  constructor(private readonly service: AtividadesService) {}

  @Patch(':id')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        titulo: { type: 'string' },
        descricao: { type: 'string' },
        formatoExigido: { type: 'string', enum: ['PDF', 'WORD', 'FOTO'] },
        prazo: { type: 'string', format: 'date-time' },
        anexo: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('anexo'))
  @LogAcao(({ resultado }) => ({
    acao: 'Editou atividade',
    alvo: (resultado as { titulo?: string })?.titulo ?? 'atividade',
  }))
  atualizar(
    @Param('id') id: string,
    @Body() dto: UpdateAtividadeDto,
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addMaxSizeValidator({ maxSize: MAX_ENTREGA_BYTES })
        .build({ fileIsRequired: false }),
    )
    anexo?: Express.Multer.File,
  ) {
    return this.service.atualizar(id, dto, user, anexo);
  }

  @Delete(':id')
  @LogAcao(({ resultado }) => ({
    acao: 'Excluiu atividade',
    alvo: (resultado as { titulo?: string })?.titulo ?? 'atividade',
  }))
  remover(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.remover(id, user);
  }

  @Get(':id/entregas')
  @ApiOkResponse({ type: EntregaDto, isArray: true })
  listarEntregas(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<EntregaDto[]> {
    return this.service.listarEntregas(id, user);
  }
}
