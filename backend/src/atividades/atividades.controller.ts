import { Body, Controller, Delete, Get, Param, Patch } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { Role } from '../../generated/prisma/client';
import { AtividadesService } from './atividades.service';
import { UpdateAtividadeDto } from './dto/update-atividade.dto';

@ApiTags('atividades')
@Roles(Role.ADMIN, Role.PROFESSOR)
@Controller('atividades')
export class AtividadesController {
  constructor(private readonly service: AtividadesService) {}

  @Patch(':id')
  atualizar(
    @Param('id') id: string,
    @Body() dto: UpdateAtividadeDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.atualizar(id, dto, user);
  }

  @Delete(':id')
  remover(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.remover(id, user);
  }

  @Get(':id/entregas')
  listarEntregas(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.listarEntregas(id, user);
  }
}
