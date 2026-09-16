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
import { ApiConsumes, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { Role } from '../../generated/prisma/client';
import { AtividadesService } from './atividades.service';
import { MAX_ENTREGA_BYTES } from './formato-entrega.util';

@ApiTags('atividades')
@Roles(Role.ALUNO)
@Controller('atividades/:id/entrega')
export class EntregaController {
  constructor(private readonly service: AtividadesService) {}

  @Post()
  @ApiConsumes('multipart/form-data')
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
  minhaEntrega(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.minhaEntrega(id, user);
  }
}
