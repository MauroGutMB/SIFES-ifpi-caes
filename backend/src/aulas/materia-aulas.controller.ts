import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { Role } from '../../generated/prisma/client';
import { AulasService } from './aulas.service';

@ApiTags('aulas')
@Roles(Role.ADMIN, Role.PROFESSOR)
@Controller('materias/:materiaId/aulas')
export class MateriaAulasController {
  constructor(private readonly service: AulasService) {}

  @Get()
  findAll(
    @Param('materiaId') materiaId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.findAllPorMateria(materiaId, user);
  }
}
