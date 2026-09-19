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
import { ApiAutenticado } from '../common/swagger-auth.decorator';

@ApiTags('alunos')
@Roles(Role.ADMIN)
@Controller('alunos')
@ApiAutenticado()
export class AlunosController {
  constructor(private readonly service: AlunosService) {}

  @Post()
  @ApiOperation({
    summary: 'Cria aluno',
    description:
      'Cria um aluno e a conta de login vinculada (login = matrícula), com senha inicial gerada — retornada uma única vez na resposta. Restrito ao admin.',
  })
  @ApiOkResponse({ type: AlunoCriadoDto })
  create(@Body() dto: CreateAlunoDto): Promise<AlunoCriadoDto> {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Lista alunos',
    description:
      'Retorna todos os alunos, com a foto de perfil. Filtra por turma via query, se informado. Restrito ao admin.',
  })
  @ApiOkResponse({ type: AlunoDto, isArray: true })
  findAll(@Query('turmaId') turmaId?: string): Promise<AlunoDto[]> {
    return this.service.findAll(turmaId);
  }

  @Roles(Role.ALUNO)
  @Get('me')
  @ApiOperation({
    summary: 'Meu perfil de aluno',
    description:
      'Retorna o perfil completo do aluno autenticado, incluindo a turma e o semestre atuais. Só o próprio aluno pode acessar.',
  })
  @ApiOkResponse({ type: AlunoMeDto })
  meuPerfil(@CurrentUser() user: AuthenticatedUser): Promise<AlunoMeDto> {
    return this.service.meuPerfil(user.alunoId!);
  }

  @Roles(Role.ALUNO)
  @Get('me/semestres')
  @ApiOperation({
    summary: 'Meu histórico de semestres',
    description:
      'Lista os semestres em que o aluno autenticado já teve alguma disciplina vinculada, com o resumo de situação (aprovadas/reprovadas/cursando) calculado a partir do boletim de cada disciplina daquele semestre. Só o próprio aluno pode acessar.',
  })
  @ApiOkResponse({ type: MeuSemestreDto, isArray: true })
  meusSemestres(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<MeuSemestreDto[]> {
    return this.service.meusSemestres(user.alunoId!);
  }

  @Roles(Role.ALUNO)
  @Get('me/turma')
  @ApiOperation({
    summary: 'Detalhes da minha turma',
    description:
      'Retorna disciplinas, professores e colegas da turma atual do aluno autenticado. Retorna null se o aluno estiver sem turma vinculada. Só o próprio aluno pode acessar.',
  })
  @ApiOkResponse({ type: MinhaTurmaDetalheDto })
  minhaTurma(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<MinhaTurmaDetalheDto | null> {
    return this.service.minhaTurmaDetalhada(user.alunoId!);
  }

  @Roles(Role.ALUNO)
  @Get('me/atividades-resumo')
  @ApiOperation({
    summary: 'Resumo de atividades por disciplina',
    description:
      'Conta, por disciplina em curso do aluno autenticado, quantas atividades já foram entregues, quantas estão pendentes (dentro do prazo, sem entrega) e quantas venceram sem entrega. Só o próprio aluno pode acessar.',
  })
  @ApiOkResponse({ type: AtividadesResumoMateriaDto, isArray: true })
  resumoAtividades(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<AtividadesResumoMateriaDto[]> {
    return this.service.resumoAtividades(user.alunoId!);
  }

  @Roles(Role.ALUNO)
  @Get('me/atividades-pendentes')
  @ApiOperation({
    summary: 'Minhas atividades pendentes',
    description:
      'Lista atividades sem entrega e ainda dentro do prazo do aluno autenticado, ordenadas pelo prazo mais próximo primeiro. Aceita "limite" para limitar a quantidade retornada (padrão 5). Só o próprio aluno pode acessar.',
  })
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
  @ApiOperation({
    summary: 'Busca aluno por id',
    description:
      'Retorna um aluno específico, incluindo a turma vinculada. Restrito ao admin.',
  })
  @ApiNotFoundResponse({ description: 'Aluno não encontrado' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Edita aluno',
    description:
      'Atualiza nome e/ou matrícula do aluno; ao trocar a matrícula, o login da conta é atualizado junto. Restrito ao admin.',
  })
  @ApiNotFoundResponse({ description: 'Aluno não encontrado' })
  @LogAcao(({ resultado }) => ({
    acao: 'Editou aluno',
    alvo: (resultado as { nome?: string })?.nome ?? 'aluno',
  }))
  update(@Param('id') id: string, @Body() dto: UpdateAlunoDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Exclui aluno',
    description:
      'Remove o aluno e a conta de login vinculada (a exclusão do usuário cascateia para o aluno). Restrito ao admin.',
  })
  @ApiNotFoundResponse({ description: 'Aluno não encontrado' })
  @LogAcao(({ resultado }) => ({
    acao: 'Excluiu aluno',
    alvo: (resultado as { nome?: string })?.nome ?? 'aluno',
  }))
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Post(':id/turma')
  @ApiOperation({
    summary: 'Vincula aluno a uma turma',
    description:
      'Matricula o aluno em uma turma, criando também os vínculos com as disciplinas já existentes dessa turma. Falha se o aluno já tiver turma vinculada — é preciso desligar da turma atual antes. Restrito ao admin.',
  })
  @ApiNotFoundResponse({ description: 'Aluno ou turma não encontrado' })
  @LogAcao(({ resultado }) => ({
    acao: 'Vinculou aluno a turma',
    alvo: (resultado as { nome?: string })?.nome ?? 'aluno',
  }))
  vincularTurma(@Param('id') id: string, @Body() dto: VincularTurmaDto) {
    return this.service.vincularTurma(id, dto.turmaId);
  }

  @Delete(':id/turma')
  @ApiOperation({
    summary: 'Desliga aluno da turma',
    description:
      'Remove o vínculo do aluno com a turma atual, deixando-o livre para ser matriculado em outra. Restrito ao admin.',
  })
  @ApiNotFoundResponse({ description: 'Aluno não encontrado' })
  @LogAcao(({ resultado }) => ({
    acao: 'Desvinculou aluno da turma',
    alvo: (resultado as { nome?: string })?.nome ?? 'aluno',
  }))
  desligarTurma(@Param('id') id: string) {
    return this.service.desligarTurma(id);
  }

  @Post(':id/materias/:materiaId')
  @ApiOperation({
    summary: 'Vincula aluno a uma disciplina',
    description:
      'Cria manualmente um vínculo do aluno com uma disciplina específica, fora do vínculo automático feito ao matricular na turma. Restrito ao admin.',
  })
  @ApiNotFoundResponse({ description: 'Aluno ou disciplina não encontrado' })
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
  @ApiOperation({
    summary: 'Remove vínculo com disciplina',
    description:
      'Remove o vínculo do aluno com uma disciplina específica. Restrito ao admin.',
  })
  @ApiNotFoundResponse({
    description: 'Aluno não está vinculado a esta disciplina',
  })
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
