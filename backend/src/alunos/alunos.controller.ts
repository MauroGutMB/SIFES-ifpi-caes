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
import { AlunosService } from './alunos.service';
import { CreateAlunoDto } from './dto/create-aluno.dto';
import { UpdateAlunoDto } from './dto/update-aluno.dto';
import { VincularTurmaDto } from './dto/vincular-turma.dto';
import { AlunoCriadoDto, AlunoDto, AlunoMeDto } from './dto/aluno.dto';
import { MeuSemestreDto } from './dto/meu-semestre.dto';
import { AtividadesResumoMateriaDto } from './dto/atividades-resumo.dto';
import { AtividadePendenteDto } from './dto/atividade-pendente.dto';
import { MinhaTurmaDetalheDto } from './dto/minha-turma-detalhe.dto';

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
  @Get('me/turma')
  @ApiOkResponse({ type: MinhaTurmaDetalheDto })
  minhaTurma(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<MinhaTurmaDetalheDto | null> {
    return this.service.minhaTurmaDetalhada(user.alunoId!);
  }

  @Roles(Role.ALUNO)
  @Get('me/atividades-resumo')
  @ApiOkResponse({ type: AtividadesResumoMateriaDto, isArray: true })
  resumoAtividades(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<AtividadesResumoMateriaDto[]> {
    return this.service.resumoAtividades(user.alunoId!);
  }

  @Roles(Role.ALUNO)
  @Get('me/atividades-pendentes')
  @ApiOkResponse({ type: AtividadePendenteDto, isArray: true })
  atividadesPendentes(
    @CurrentUser() user: AuthenticatedUser,
    @Query('limite') limite?: string,
  ): Promise<AtividadePendenteDto[]> {
    return this.service.atividadesPendentes(
      user.alunoId!,
      limite ? Number(limite) : undefined,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @LogAcao(({ resultado }) => ({
    acao: 'Editou aluno',
    alvo: (resultado as { nome?: string })?.nome ?? 'aluno',
  }))
  update(@Param('id') id: string, @Body() dto: UpdateAlunoDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @LogAcao(({ resultado }) => ({
    acao: 'Excluiu aluno',
    alvo: (resultado as { nome?: string })?.nome ?? 'aluno',
  }))
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Post(':id/turma')
  @LogAcao(({ resultado }) => ({
    acao: 'Vinculou aluno a turma',
    alvo: (resultado as { nome?: string })?.nome ?? 'aluno',
  }))
  vincularTurma(@Param('id') id: string, @Body() dto: VincularTurmaDto) {
    return this.service.vincularTurma(id, dto.turmaId);
  }

  @Delete(':id/turma')
  @LogAcao(({ resultado }) => ({
    acao: 'Desvinculou aluno da turma',
    alvo: (resultado as { nome?: string })?.nome ?? 'aluno',
  }))
  desligarTurma(@Param('id') id: string) {
    return this.service.desligarTurma(id);
  }

  @Post(':id/materias/:materiaId')
  @LogAcao(({ resultado }) => {
    const r = resultado as { alunoNome?: string; materiaNome?: string };
    return {
      acao: 'Vinculou aluno a disciplina',
      alvo: `${r?.alunoNome ?? 'aluno'} — ${r?.materiaNome ?? 'disciplina'}`,
    };
  })
  adicionarMateria(
    @Param('id') id: string,
    @Param('materiaId') materiaId: string,
  ) {
    return this.service.adicionarMateria(id, materiaId);
  }

  @Delete(':id/materias/:materiaId')
  @LogAcao(({ resultado }) => {
    const r = resultado as { alunoNome?: string; materiaNome?: string };
    return {
      acao: 'Removeu vínculo de aluno com disciplina',
      alvo: `${r?.alunoNome ?? 'aluno'} — ${r?.materiaNome ?? 'disciplina'}`,
    };
  })
  removerMateria(
    @Param('id') id: string,
    @Param('materiaId') materiaId: string,
  ) {
    return this.service.removerMateria(id, materiaId);
  }
}
