import { Controller, Get, Param } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { Role } from '../../generated/prisma/client';
import { AulasService } from './aulas.service';
import { AulaDto } from './dto/aula.dto';

@ApiTags('aulas')
@Roles(Role.ADMIN, Role.PROFESSOR)
@Controller('materias/:materiaId/aulas')
export class MateriaAulasController {
  constructor(private readonly service: AulasService) {}

  @Get()
  @ApiOkResponse({ type: AulaDto, isArray: true })
  findAll(
    @Param('materiaId') materiaId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<AulaDto[]> {
    return this.service.findAllPorMateria(materiaId, user);
  }
}
