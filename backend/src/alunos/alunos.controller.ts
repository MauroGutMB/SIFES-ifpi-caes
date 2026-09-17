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
import { AlunosService } from './alunos.service';
import { CreateAlunoDto } from './dto/create-aluno.dto';
import { UpdateAlunoDto } from './dto/update-aluno.dto';
import { VincularTurmaDto } from './dto/vincular-turma.dto';
import { AlunoCriadoDto, AlunoDto, AlunoMeDto } from './dto/aluno.dto';
import { MeuSemestreDto } from './dto/meu-semestre.dto';
import { AtividadesResumoMateriaDto } from './dto/atividades-resumo.dto';

@ApiTags('alunos')
@Roles(Role.ADMIN)
@Controller('alunos')
export class AlunosController {
  constructor(private readonly service: AlunosService) {}

  @Post()
  @ApiOkResponse({ type: AlunoCriadoDto })
  create(@Body() dto: CreateAlunoDto): Promise<AlunoCriadoDto> {
    return this.service.create(dto);
  }

  @Get()
  @ApiOkResponse({ type: AlunoDto, isArray: true })
  findAll(@Query('turmaId') turmaId?: string): Promise<AlunoDto[]> {
    return this.service.findAll(turmaId);
  }

  @Roles(Role.ALUNO)
  @Get('me')
  @ApiOkResponse({ type: AlunoMeDto })
  meuPerfil(@CurrentUser() user: AuthenticatedUser): Promise<AlunoMeDto> {
    return this.service.meuPerfil(user.alunoId!);
  }

  @Roles(Role.ALUNO)
  @Get('me/semestres')
  @ApiOkResponse({ type: MeuSemestreDto, isArray: true })
  meusSemestres(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<MeuSemestreDto[]> {
    return this.service.meusSemestres(user.alunoId!);
  }

  @Roles(Role.ALUNO)
  @Get('me/atividades-resumo')
  @ApiOkResponse({ type: AtividadesResumoMateriaDto, isArray: true })
  resumoAtividades(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<AtividadesResumoMateriaDto[]> {
    return this.service.resumoAtividades(user.alunoId!);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAlunoDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Post(':id/turma')
  vincularTurma(@Param('id') id: string, @Body() dto: VincularTurmaDto) {
    return this.service.vincularTurma(id, dto.turmaId);
  }

  @Delete(':id/turma')
  desligarTurma(@Param('id') id: string) {
    return this.service.desligarTurma(id);
  }

  @Post(':id/materias/:materiaId')
  adicionarMateria(
    @Param('id') id: string,
    @Param('materiaId') materiaId: string,
  ) {
    return this.service.adicionarMateria(id, materiaId);
  }

  @Delete(':id/materias/:materiaId')
  removerMateria(
    @Param('id') id: string,
    @Param('materiaId') materiaId: string,
  ) {
    return this.service.removerMateria(id, materiaId);
  }
}
