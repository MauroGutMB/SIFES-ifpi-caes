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
import { ApiConsumes, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { Role } from '../../generated/prisma/client';
import { MateriaisAulaService } from './materiais-aula.service';
import { CreateMaterialAulaDto } from './dto/create-material-aula.dto';

const MAX_MATERIAL_BYTES = 20 * 1024 * 1024; // 20MB

@ApiTags('materiais-aula')
@Roles(Role.ADMIN, Role.PROFESSOR)
@Controller('aulas/:aulaId/materiais')
export class MateriaisAulaController {
  constructor(private readonly service: MateriaisAulaService) {}

  @Post()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('arquivo'))
  criar(
    @Param('aulaId') aulaId: string,
    @Body() dto: CreateMaterialAulaDto,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addMaxSizeValidator({ maxSize: MAX_MATERIAL_BYTES })
        .build(),
    )
    file: Express.Multer.File,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.criar(aulaId, dto, file, user);
  }

  @Get()
  listar(
    @Param('aulaId') aulaId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.listar(aulaId, user);
  }
}
