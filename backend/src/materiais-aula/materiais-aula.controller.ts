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
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { Role } from '../../generated/prisma/client';
import { FileSignatureValidationPipe } from '../common/file-signature-validation.pipe';
import { MateriaisAulaService } from './materiais-aula.service';
import { CreateMaterialAulaDto } from './dto/create-material-aula.dto';
import { MaterialAulaDto } from './dto/material-aula.dto';
import { ApiAutenticado } from '../common/swagger-auth.decorator';

const MAX_MATERIAL_BYTES = 20 * 1024 * 1024; // 20MB

// Material de aula é intencionalmente flexível (o professor pode subir slide, apostila, foto),
// mas ainda assim restrito a um allowlist — nunca aceita tipos executáveis pelo navegador
// (html, svg, javascript), que é o vetor de XSS armazenado que essa validação existe pra fechar.
const MATERIAL_MIME_TIPOS = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
];
const MATERIAL_MIME_REGEX = new RegExp(
  `^(${MATERIAL_MIME_TIPOS.map((mime) => mime.replace(/[.+]/g, '\\$&')).join('|')})$`,
);

@ApiTags('materiais-aula')
@Roles(Role.ADMIN, Role.PROFESSOR)
@Controller('aulas/:aulaId/materiais')
@ApiAutenticado()
export class MateriaisAulaController {
  constructor(private readonly service: MateriaisAulaService) {}

  @Post()
  @ApiOperation({
    summary: 'Enviar material de aula',
    description:
      'Faz upload de um material (slide, apostila, foto) vinculado a uma aula. Aceita PDF, JPEG, PNG, Word e PowerPoint — o tipo é validado pela assinatura binária real do arquivo, não só extensão/mimetype declarado, para impedir upload de conteúdo executável disfarçado (ex: HTML/SVG com script).',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['titulo', 'arquivo'],
      properties: {
        titulo: { type: 'string' },
        arquivo: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Aula não encontrada' })
  @ApiBadRequestResponse({
    description:
      'Tipo de arquivo não permitido ou tamanho acima do limite (20MB)',
  })
  @UseInterceptors(FileInterceptor('arquivo'))
  criar(
    @Param('aulaId') aulaId: string,
    @Body() dto: CreateMaterialAulaDto,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({ fileType: MATERIAL_MIME_REGEX })
        .addMaxSizeValidator({ maxSize: MAX_MATERIAL_BYTES })
        .build(),
      new FileSignatureValidationPipe(MATERIAL_MIME_TIPOS),
    )
    file: Express.Multer.File,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.criar(aulaId, dto, file, user);
  }

  @Roles(Role.ADMIN, Role.PROFESSOR, Role.ALUNO)
  @Get()
  @ApiOperation({
    summary: 'Listar materiais de uma aula',
    description: 'Lista os materiais enviados para uma aula.',
  })
  @ApiNotFoundResponse({ description: 'Aula não encontrada' })
  @ApiOkResponse({ type: MaterialAulaDto, isArray: true })
  listar(
    @Param('aulaId') aulaId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<MaterialAulaDto[]> {
    return this.service.listar(aulaId, user);
  }
}
