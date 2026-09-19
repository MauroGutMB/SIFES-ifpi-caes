import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { Role } from '../../generated/prisma/client';
import { LogAcao } from '../logs/log-acao.decorator';
import { MateriasService } from './materias.service';
import { CreateMateriaDto } from './dto/create-materia.dto';
import { UpdateMateriaDto } from './dto/update-materia.dto';
import { MateriaDto } from './dto/materia.dto';

@ApiTags('materias')
@Roles(Role.ADMIN)
@Controller('materias')
export class MateriasController {
  constructor(private readonly service: MateriasService) {}

  @Post()
  create(@Body() dto: CreateMateriaDto) {
    return this.service.create(dto);
  }

  @Roles(Role.ADMIN, Role.PROFESSOR, Role.ALUNO)
  @Get()
  @ApiOkResponse({ type: MateriaDto, isArray: true })
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query('turmaId') turmaId?: string,
    @Query('professorId') professorId?: string,
  ): Promise<MateriaDto[]> {
    // Professor só enxerga as próprias matérias, aluno só as que está vinculado —
    // ignora professorId vindo da query pra esses dois papéis.
    const professorIdEfetivo =
      user.role === Role.PROFESSOR ? user.professorId : professorId;
    const vinculadoAlunoId =
      user.role === Role.ALUNO ? user.alunoId : undefined;
    return this.service.findAll({
      turmaId,
      professorId: professorIdEfetivo,
      vinculadoAlunoId,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @LogAcao(({ resultado }) => ({
    acao: 'Editou disciplina',
    alvo: (resultado as { nome?: string })?.nome ?? 'disciplina',
  }))
  update(@Param('id') id: string, @Body() dto: UpdateMateriaDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @LogAcao(({ resultado }) => ({
    acao: 'Excluiu disciplina',
    alvo: (resultado as { nome?: string })?.nome ?? 'disciplina',
  }))
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Roles(Role.ADMIN, Role.PROFESSOR)
  @Post(':id/encerrar')
  @LogAcao(({ resultado }) => ({
    acao: 'Encerrou disciplina',
    alvo: (resultado as { nome?: string })?.nome ?? 'disciplina',
  }))
  encerrar(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.encerrar(id, user);
  }

  @Post(':id/reabrir')
  @LogAcao(({ resultado }) => ({
    acao: 'Reabriu disciplina',
    alvo: (resultado as { nome?: string })?.nome ?? 'disciplina',
  }))
  reabrir(@Param('id') id: string) {
    return this.service.reabrir(id);
  }
}
