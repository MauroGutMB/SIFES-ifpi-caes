import { Controller, Get, Param } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { Role } from '../../generated/prisma/client';
import { AulasService } from './aulas.service';
import { AulaDto } from './dto/aula.dto';
import { ApiAutenticado } from '../common/swagger-auth.decorator';

@ApiTags('aulas')
@Roles(Role.ADMIN, Role.PROFESSOR, Role.ALUNO)
@Controller('materias/:materiaId/aulas')
@ApiAutenticado()
export class MateriaAulasController {
  constructor(private readonly service: AulasService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar aulas da disciplina',
    description:
      'Lista as aulas de uma disciplina. Professor/aluno só enxergam aulas com data já passada; admin vê o calendário completo, incluindo aulas futuras (usado para gerenciar overrides).',
  })
  @ApiNotFoundResponse({ description: 'Disciplina não encontrada' })
  @ApiOkResponse({ type: AulaDto, isArray: true })
  findAll(
    @Param('materiaId') materiaId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<AulaDto[]> {
    return this.service.findAllPorMateria(materiaId, user);
  }
}
