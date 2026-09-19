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
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { EstadoMateria, Role } from '../../generated/prisma/client';
import { LogAcao } from '../logs/log-acao.decorator';
import { MateriasService } from './materias.service';
import { CreateMateriaDto } from './dto/create-materia.dto';
import { UpdateMateriaDto } from './dto/update-materia.dto';
import { MateriaDto } from './dto/materia.dto';
import { ApiAutenticado } from '../common/swagger-auth.decorator';

@ApiTags('materias')
@Roles(Role.ADMIN)
@Controller('materias')
@ApiAutenticado()
export class MateriasController {
  constructor(private readonly service: MateriasService) {}

  @Post()
  @ApiOperation({
    summary: 'Cria disciplina',
    description:
      'Cria uma disciplina vinculada a uma turma e um professor, com os horários semanais informados. Gera automaticamente as aulas do semestre da turma, validando que não há conflito de horário com outra disciplina da mesma turma. Restrito ao admin.',
  })
  @ApiNotFoundResponse({ description: 'Turma ou professor não encontrado' })
  create(@Body() dto: CreateMateriaDto) {
    return this.service.create(dto);
  }

  @Roles(Role.ADMIN, Role.PROFESSOR, Role.ALUNO)
  @Get()
  @ApiOperation({
    summary: 'Lista disciplinas',
    description:
      'Retorna disciplinas com turma, professor e horários. Filtra por turma, professor e estado via query. Professor só enxerga as próprias disciplinas e aluno só as que está vinculado — o filtro de professorId da query é ignorado para esses dois papéis.',
  })
  @ApiOkResponse({ type: MateriaDto, isArray: true })
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query('turmaId') turmaId?: string,
    @Query('professorId') professorId?: string,
    @Query('estado') estado?: EstadoMateria,
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
      estado,
    });
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Busca disciplina por id',
    description:
      'Retorna uma disciplina específica, com turma, professor, horários e a contagem de aulas e alunos vinculados. Restrito ao admin.',
  })
  @ApiNotFoundResponse({ description: 'Disciplina não encontrada' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Edita disciplina',
    description:
      'Atualiza dados da disciplina; ao trocar turma, professor ou horários, revalida conflitos de horário e regenera as aulas conforme o novo semestre/horário. Restrito ao admin.',
  })
  @ApiNotFoundResponse({
    description: 'Disciplina, turma ou professor não encontrado',
  })
  @LogAcao(({ resultado }) => ({
    acao: 'Editou disciplina',
    alvo: (resultado as { nome?: string })?.nome ?? 'disciplina',
  }))
  update(@Param('id') id: string, @Body() dto: UpdateMateriaDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Exclui disciplina',
    description: 'Remove a disciplina. Restrito ao admin.',
  })
  @ApiNotFoundResponse({ description: 'Disciplina não encontrada' })
  @LogAcao(({ resultado }) => ({
    acao: 'Excluiu disciplina',
    alvo: (resultado as { nome?: string })?.nome ?? 'disciplina',
  }))
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Roles(Role.ADMIN, Role.PROFESSOR)
  @Post(':id/encerrar')
  @ApiOperation({
    summary: 'Encerra disciplina',
    description:
      'Marca a disciplina como encerrada e desliga automaticamente da turma todo aluno vinculado que foi aprovado em todas as disciplinas dela nesse semestre. Professor só pode encerrar a própria disciplina, e só após o fim do semestre; admin pode a qualquer momento.',
  })
  @ApiNotFoundResponse({ description: 'Disciplina não encontrada' })
  @LogAcao(({ resultado }) => ({
    acao: 'Encerrou disciplina',
    alvo: (resultado as { nome?: string })?.nome ?? 'disciplina',
  }))
  encerrar(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.encerrar(id, user);
  }

  @Post(':id/reabrir')
  @ApiOperation({
    summary: 'Reabre disciplina',
    description:
      'Reverte o encerramento de uma disciplina já encerrada, como correção. Restrito ao admin.',
  })
  @ApiNotFoundResponse({ description: 'Disciplina não encontrada' })
  @LogAcao(({ resultado }) => ({
    acao: 'Reabriu disciplina',
    alvo: (resultado as { nome?: string })?.nome ?? 'disciplina',
  }))
  reabrir(@Param('id') id: string) {
    return this.service.reabrir(id);
  }
}
