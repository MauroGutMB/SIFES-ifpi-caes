import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { Role } from '../../generated/prisma/client';
import { PlanoDisciplinaService } from './plano-disciplina.service';
import { CreateItemAvaliacaoDto } from './dto/create-item-avaliacao.dto';

@ApiTags('plano-disciplina')
@Roles(Role.ADMIN, Role.PROFESSOR)
@Controller('materias/:materiaId')
export class MateriaPlanoController {
  constructor(private readonly service: PlanoDisciplinaService) {}

  @Post('itens-avaliacao')
  criarItem(
    @Param('materiaId') materiaId: string,
    @Body() dto: CreateItemAvaliacaoDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.criarItem(materiaId, dto, user);
  }

  @Get('itens-avaliacao')
  listarItens(
    @Param('materiaId') materiaId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.listarItens(materiaId, user);
  }

  @Get('boletim')
  boletim(
    @Param('materiaId') materiaId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.boletimMateria(materiaId, user);
  }
}
