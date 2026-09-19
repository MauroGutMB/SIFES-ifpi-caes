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
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConsumes,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { Role } from '../../generated/prisma/client';
import { LogAcao } from '../logs/log-acao.decorator';
import { AtividadesService } from './atividades.service';
import { UpdateAtividadeDto } from './dto/update-atividade.dto';
import { EntregaDto } from './dto/entrega.dto';
import { MAX_ENTREGA_BYTES } from './formato-entrega.util';
import { ApiAutenticado } from '../common/swagger-auth.decorator';

@ApiTags('atividades')
@Roles(Role.ADMIN, Role.PROFESSOR)
@Controller('atividades')
@ApiAutenticado()
export class AtividadesController {
  constructor(private readonly service: AtividadesService) {}

  @Patch(':id')
  @ApiOperation({
    summary: 'Editar atividade',
    description:
      'Edita título, descrição, formato exigido, prazo e/ou anexo de uma atividade. Só é permitido enquanto a disciplina estiver ABERTA.',
  })
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
  @ApiNotFoundResponse({ description: 'Atividade não encontrada' })
  @ApiBadRequestResponse({ description: 'Disciplina já encerrada' })
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
  @ApiOperation({
    summary: 'Excluir atividade',
    description:
      'Exclui uma atividade. Só é permitido enquanto a disciplina estiver ABERTA.',
  })
  @ApiNotFoundResponse({ description: 'Atividade não encontrada' })
  @ApiBadRequestResponse({ description: 'Disciplina já encerrada' })
  @LogAcao(({ resultado }) => ({
    acao: 'Excluiu atividade',
    alvo: (resultado as { titulo?: string })?.titulo ?? 'atividade',
  }))
  remover(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.remover(id, user);
  }

  @Get(':id/entregas')
  @ApiOperation({
    summary: 'Listar entregas de uma atividade',
    description:
      'Lista as entregas feitas pelos alunos para uma atividade específica.',
  })
  @ApiNotFoundResponse({ description: 'Atividade não encontrada' })
  @ApiOkResponse({ type: EntregaDto, isArray: true })
  listarEntregas(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<EntregaDto[]> {
    return this.service.listarEntregas(id, user);
  }
}
