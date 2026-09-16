import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { Role } from '../../generated/prisma/client';
import { AtividadesService } from './atividades.service';
import { CreateAtividadeDto } from './dto/create-atividade.dto';

@ApiTags('atividades')
@Roles(Role.ADMIN, Role.PROFESSOR)
@Controller('materias/:materiaId/atividades')
export class MateriaAtividadesController {
  constructor(private readonly service: AtividadesService) {}

  @Post()
  criar(
    @Param('materiaId') materiaId: string,
    @Body() dto: CreateAtividadeDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.criar(materiaId, dto, user);
  }

  @Get()
  listar(
    @Param('materiaId') materiaId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.listarPorMateria(materiaId, user);
  }
}
