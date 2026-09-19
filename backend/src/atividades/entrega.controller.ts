import {
  Controller,
  Get,
  Param,
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
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { Role } from '../../generated/prisma/client';
import { AtividadesService } from './atividades.service';
import { MAX_ENTREGA_BYTES } from './formato-entrega.util';
import { MinhaEntregaDto } from './dto/entrega.dto';
import { ApiAutenticado } from '../common/swagger-auth.decorator';

@ApiTags('atividades')
@Roles(Role.ALUNO)
@Controller('atividades/:id/entrega')
@ApiAutenticado()
export class EntregaController {
  constructor(private readonly service: AtividadesService) {}

  @Post()
  @ApiOperation({
    summary: 'Enviar entrega da atividade',
    description:
      'Aluno envia (ou reenvia, substituindo a anterior) o arquivo de entrega de uma atividade. O formato do arquivo é validado pela assinatura binária real, não só pela extensão, contra o `formatoExigido` da atividade.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['arquivo'],
      properties: { arquivo: { type: 'string', format: 'binary' } },
    },
  })
  @ApiNotFoundResponse({ description: 'Atividade não encontrada' })
  @ApiBadRequestResponse({
    description:
      'Arquivo não corresponde ao formato exigido, prazo expirado, ou disciplina encerrada',
  })
  @UseInterceptors(FileInterceptor('arquivo'))
  entregar(
    @Param('id') id: string,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addMaxSizeValidator({ maxSize: MAX_ENTREGA_BYTES })
        .build(),
    )
    file: Express.Multer.File,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.entregar(id, file, user);
  }

  @Get()
  @ApiOperation({
    summary: 'Consultar minha entrega',
    description:
      'Retorna a própria entrega enviada pelo aluno para uma atividade, ou null se ainda não enviou.',
  })
  @ApiNotFoundResponse({ description: 'Atividade não encontrada' })
  @ApiOkResponse({ type: MinhaEntregaDto })
  minhaEntrega(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<MinhaEntregaDto | null> {
    return this.service.minhaEntrega(id, user);
  }
}
