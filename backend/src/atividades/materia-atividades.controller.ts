import {
  Body,
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
import { CreateAtividadeDto } from './dto/create-atividade.dto';
import { AtividadeDto } from './dto/atividade.dto';
import { MAX_ENTREGA_BYTES } from './formato-entrega.util';
import { ApiAutenticado } from '../common/swagger-auth.decorator';

@ApiTags('atividades')
@Roles(Role.ADMIN, Role.PROFESSOR)
@Controller('materias/:materiaId/atividades')
@ApiAutenticado()
export class MateriaAtividadesController {
  constructor(private readonly service: AtividadesService) {}

  @Post()
  @ApiOperation({
    summary: 'Criar atividade',
    description:
      'Cria uma atividade (com prazo e formato de entrega exigido) numa disciplina. Só é permitido enquanto a disciplina estiver ABERTA.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['titulo', 'formatoExigido', 'prazo'],
      properties: {
        titulo: { type: 'string' },
        descricao: { type: 'string' },
        formatoExigido: { type: 'string', enum: ['PDF', 'WORD', 'FOTO'] },
        prazo: { type: 'string', format: 'date-time' },
        anexo: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Disciplina não encontrada' })
  @ApiBadRequestResponse({ description: 'Disciplina já encerrada' })
  @UseInterceptors(FileInterceptor('anexo'))
  criar(
    @Param('materiaId') materiaId: string,
    @Body() dto: CreateAtividadeDto,
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addMaxSizeValidator({ maxSize: MAX_ENTREGA_BYTES })
        .build({ fileIsRequired: false }),
    )
    anexo?: Express.Multer.File,
  ) {
    return this.service.criar(materiaId, dto, user, anexo);
  }

  @Roles(Role.ADMIN, Role.PROFESSOR, Role.ALUNO)
  @Get()
  @ApiOperation({
    summary: 'Listar atividades da disciplina',
    description: 'Lista as atividades cadastradas numa disciplina.',
  })
  @ApiNotFoundResponse({ description: 'Disciplina não encontrada' })
  @ApiOkResponse({ type: AtividadeDto, isArray: true })
  listar(
    @Param('materiaId') materiaId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<AtividadeDto[]> {
    return this.service.listarPorMateria(materiaId, user);
  }
}
