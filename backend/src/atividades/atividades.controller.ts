import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
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
import { AtividadesService } from './atividades.service';
import { UpdateAtividadeDto } from './dto/update-atividade.dto';
import { EntregaDto } from './dto/entrega.dto';

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
        anexo: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('anexo'))
  atualizar(
    @Param('id') id: string,
    @Body() dto: UpdateAtividadeDto,
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() anexo?: Express.Multer.File,
  ) {
    return this.service.atualizar(id, dto, user, anexo);
  }

  @Delete(':id')
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
