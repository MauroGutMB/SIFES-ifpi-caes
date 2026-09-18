import {
  Controller,
  Delete,
  Get,
  Param,
  ParseFilePipeBuilder,
  Post,
  Put,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { Role } from '../../generated/prisma/client';
import {
  FOTO_MIME_REGEX,
  FOTO_MIME_TIPOS,
  MAX_FOTO_BYTES,
} from '../common/foto.util';
import { FileSignatureValidationPipe } from '../common/file-signature-validation.pipe';
import { UsersService } from './users.service';
import { UserMeDto } from './dto/user-me.dto';
import { UserDto } from './dto/user.dto';
import { SenhaRedefinidaDto } from './dto/senha-redefinida.dto';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Roles(Role.ADMIN)
  @Get()
  @ApiOkResponse({ type: UserDto, isArray: true })
  findAll(@Query('role') role?: Role): Promise<UserDto[]> {
    return this.usersService.findAll(role);
  }

  @Get('me')
  @ApiOkResponse({ type: UserMeDto })
  me(@CurrentUser() user: AuthenticatedUser): Promise<UserMeDto> {
    return this.usersService.findMe(user.id);
  }

  // Aluno troca a foto por solicitação — ver FotoSolicitacoesModule.
  @Roles(Role.ADMIN, Role.PROFESSOR)
  @Post('me/foto')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['foto'],
      properties: { foto: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(FileInterceptor('foto'))
  updateFoto(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({ fileType: FOTO_MIME_REGEX })
        .addMaxSizeValidator({ maxSize: MAX_FOTO_BYTES })
        .build(),
      new FileSignatureValidationPipe(FOTO_MIME_TIPOS),
    )
    file: Express.Multer.File,
  ) {
    return this.usersService.updateFotoFromUpload(user.id, file);
  }

  @Roles(Role.ADMIN)
  @Delete(':id/foto')
  removerFoto(@Param('id') id: string) {
    return this.usersService.removerFoto(id);
  }

  @Roles(Role.ADMIN)
  @Put(':id/redefinir-senha')
  @ApiOkResponse({ type: SenhaRedefinidaDto })
  redefinirSenha(@Param('id') id: string): Promise<SenhaRedefinidaDto> {
    return this.usersService.resetarSenha(id);
  }
}
