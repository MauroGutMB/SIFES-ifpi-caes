import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { Role } from '../../generated/prisma/client';
import { AtividadesService } from './atividades.service';
import { CreateAtividadeDto } from './dto/create-atividade.dto';
import { AtividadeDto } from './dto/atividade.dto';

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

  @Roles(Role.ADMIN, Role.PROFESSOR, Role.ALUNO)
  @Get()
  @ApiOkResponse({ type: AtividadeDto, isArray: true })
  listar(
    @Param('materiaId') materiaId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<AtividadeDto[]> {
    return this.service.listarPorMateria(materiaId, user);
  }
}
