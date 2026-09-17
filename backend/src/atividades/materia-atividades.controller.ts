import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { Role } from '../../generated/prisma/client';
import { AtividadesService } from './atividades.service';
import { CreateAtividadeDto } from './dto/create-atividade.dto';
import { AtividadeDto } from './dto/atividade.dto';

@ApiTags('atividades')
@Roles(Role.ADMIN, Role.PROFESSOR)
@Controller('materias/:materiaId/atividades')
export class MateriaAtividadesController {
  constructor(private readonly service: AtividadesService) {}

  @Post()
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
  @UseInterceptors(FileInterceptor('anexo'))
  criar(
    @Param('materiaId') materiaId: string,
    @Body() dto: CreateAtividadeDto,
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() anexo?: Express.Multer.File,
  ) {
    return this.service.criar(materiaId, dto, user, anexo);
  }

  @Roles(Role.ADMIN, Role.PROFESSOR, Role.ALUNO)
  @Get()
  @ApiOkResponse({ type: AtividadeDto, isArray: true })
  listar(
    @Param('materiaId') materiaId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<AtividadeDto[]> {
    return this.service.listarPorMateria(materiaId, user);
  }
}
