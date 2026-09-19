import {
  applyDecorators,
  BadRequestException,
  Controller,
  Get,
  Param,
  Query,
  StreamableFile,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiProduces,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { Role } from '../../generated/prisma/client';
import { RelatoriosService } from './relatorios.service';
import { RelatorioFrequenciaTurmaDto } from './dto/frequencia-turma-relatorio.dto';
import { ApiAutenticado } from '../common/swagger-auth.decorator';
import {
  extensaoParaFormato,
  Formato,
  mimeParaFormato,
} from './report-render.util';

function parseFormato(formato?: string): Formato {
  if (formato === undefined || formato === 'pdf') return 'pdf';
  if (formato === 'xlsx') return 'xlsx';
  throw new BadRequestException('formato deve ser "pdf" ou "xlsx"');
}

/** Toda rota deste controller que gera PDF/Excel compartilha o mesmo contrato de resposta
 * (arquivo binário pra download) e o mesmo query param `formato` — documentado uma vez aqui
 * em vez de repetir em cada rota. Sem isso, o Swagger mostra a resposta como "200 vazio" e o
 * campo `formato` sem tipo/enum, indistinguível de uma rota que não retorna nada. */
function ApiRelatorioBinario() {
  return applyDecorators(
    ApiProduces(
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ),
    ApiQuery({
      name: 'formato',
      enum: ['pdf', 'xlsx'],
      required: false,
      description: 'Formato do arquivo gerado. Padrão: "pdf".',
    }),
    ApiOkResponse({
      description:
        'Arquivo binário para download (PDF ou Excel, conforme `formato`) — não é JSON.',
      schema: { type: 'string', format: 'binary' },
    }),
    ApiBadRequestResponse({
      description: '`formato` recebido não é "pdf" nem "xlsx"',
    }),
  );
}

@ApiTags('relatorios')
@Controller('relatorios')
@ApiAutenticado()
export class RelatoriosController {
  constructor(private readonly service: RelatoriosService) {}

  private empacotar(
    resultado: { buffer: Buffer; nomeBase: string },
    formato: Formato,
  ) {
    return new StreamableFile(resultado.buffer, {
      type: mimeParaFormato(formato),
      disposition: `attachment; filename="${resultado.nomeBase}.${extensaoParaFormato(formato)}"`,
    });
  }

  @Roles(Role.ADMIN, Role.PROFESSOR)
  @Get('diario/:materiaId')
  @ApiRelatorioBinario()
  @ApiOperation({
    summary: 'Diário de classe da disciplina',
    description:
      'Gera o diário de classe (aulas, conteúdo e frequência) de uma disciplina. Professor só gera o diário das próprias disciplinas.',
  })
  async diario(
    @Param('materiaId') materiaId: string,
    @Query('formato') formatoQuery: string | undefined,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const formato = parseFormato(formatoQuery);
    const resultado = await this.service.diarioMateria(
      materiaId,
      formato,
      user,
    );
    return this.empacotar(resultado, formato);
  }

  @Roles(Role.ADMIN, Role.ALUNO)
  @Get('boletim/:alunoId')
  @ApiRelatorioBinario()
  @ApiQuery({
    name: 'semestreId',
    required: false,
    description:
      'Filtra o boletim para um semestre específico. Sem isso, considera o semestre atual do aluno.',
  })
  @ApiOperation({
    summary: 'Boletim do aluno',
    description:
      'Gera o boletim (notas, situação e frequência por disciplina) de um aluno. Aluno só gera o próprio boletim.',
  })
  async boletim(
    @Param('alunoId') alunoId: string,
    @Query('formato') formatoQuery: string | undefined,
    @Query('semestreId') semestreId: string | undefined,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const formato = parseFormato(formatoQuery);
    const resultado = await this.service.boletimAluno(
      alunoId,
      formato,
      user,
      semestreId,
    );
    return this.empacotar(resultado, formato);
  }

  @Roles(Role.ADMIN)
  @Get('turma/:turmaId')
  @ApiRelatorioBinario()
  @ApiOperation({
    summary: 'Lista de alunos da turma',
    description: 'Gera a lista de alunos matriculados numa turma.',
  })
  async listaTurma(
    @Param('turmaId') turmaId: string,
    @Query('formato') formatoQuery: string | undefined,
  ) {
    const formato = parseFormato(formatoQuery);
    const resultado = await this.service.listaTurma(turmaId, formato);
    return this.empacotar(resultado, formato);
  }

  @Roles(Role.ADMIN, Role.PROFESSOR)
  @Get('frequencia-materia/:materiaId')
  @ApiRelatorioBinario()
  @ApiOperation({
    summary: 'Frequência da disciplina',
    description:
      'Gera o relatório de frequência (percentual de presença por aluno) de uma disciplina. Professor só gera de disciplinas próprias.',
  })
  async frequenciaMateria(
    @Param('materiaId') materiaId: string,
    @Query('formato') formatoQuery: string | undefined,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const formato = parseFormato(formatoQuery);
    const resultado = await this.service.frequenciaMateria(
      materiaId,
      formato,
      user,
    );
    return this.empacotar(resultado, formato);
  }

  @Roles(Role.ADMIN)
  @Get('frequencia-turma/:turmaId')
  @ApiRelatorioBinario()
  @ApiOperation({
    summary: 'Frequência da turma',
    description:
      'Gera o relatório de frequência de todas as disciplinas de uma turma.',
  })
  async frequenciaTurma(
    @Param('turmaId') turmaId: string,
    @Query('formato') formatoQuery: string | undefined,
  ) {
    const formato = parseFormato(formatoQuery);
    const resultado = await this.service.frequenciaTurma(turmaId, formato);
    return this.empacotar(resultado, formato);
  }

  @Roles(Role.PROFESSOR, Role.ALUNO)
  @Get('agenda')
  @ApiRelatorioBinario()
  @ApiOperation({
    summary: 'Agenda semanal do usuário logado',
    description:
      'Gera a agenda semanal de aulas do próprio professor ou aluno autenticado, com base nas disciplinas em que está vinculado no semestre atual.',
  })
  async agendaSemanal(
    @Query('formato') formatoQuery: string | undefined,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const formato = parseFormato(formatoQuery);
    const resultado = await this.service.agendaSemanal(formato, user);
    return this.empacotar(resultado, formato);
  }

  @Roles(Role.ADMIN)
  @Get('usuarios')
  @ApiRelatorioBinario()
  @ApiQuery({
    name: 'role',
    enum: Role,
    required: false,
    description:
      'Filtra o relatório por papel (ADMIN/PROFESSOR/ALUNO). Sem isso, lista todos.',
  })
  @ApiOperation({
    summary: 'Relatório de usuários ativos',
    description:
      'Gera a lista de usuários ativos do sistema, com filtro opcional por papel.',
  })
  async usuarios(
    @Query('formato') formatoQuery: string | undefined,
    @Query('role') role: Role | undefined,
  ) {
    const formato = parseFormato(formatoQuery);
    const resultado = await this.service.usuariosAtivos(formato, role);
    return this.empacotar(resultado, formato);
  }

  @Roles(Role.ADMIN, Role.PROFESSOR, Role.ALUNO)
  @Get('turma/:turmaId/frequencia')
  @ApiOperation({
    summary: 'Frequência detalhada da turma (JSON)',
    description:
      'Retorna, em JSON (não é arquivo), a frequência detalhada por aula da turma, com filtros opcionais por disciplina, aluno e intervalo de datas. Diferente das demais rotas deste controller — esta não gera PDF/Excel.',
  })
  @ApiQuery({ name: 'materiaId', required: false })
  @ApiQuery({ name: 'alunoId', required: false })
  @ApiQuery({
    name: 'dataInicio',
    required: false,
    description: 'Data no formato ISO (AAAA-MM-DD)',
  })
  @ApiQuery({
    name: 'dataFim',
    required: false,
    description: 'Data no formato ISO (AAAA-MM-DD)',
  })
  @ApiOkResponse({ type: RelatorioFrequenciaTurmaDto })
  frequenciaTurmaDetalhada(
    @Param('turmaId') turmaId: string,
    @Query('materiaId') materiaId: string | undefined,
    @Query('alunoId') alunoId: string | undefined,
    @Query('dataInicio') dataInicio: string | undefined,
    @Query('dataFim') dataFim: string | undefined,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<RelatorioFrequenciaTurmaDto> {
    return this.service.frequenciaTurmaDetalhada(turmaId, user, {
      materiaId,
      alunoId,
      dataInicio,
      dataFim,
    });
  }

  @Roles(Role.ADMIN, Role.PROFESSOR)
  @Get('turma/:turmaId/frequencia-por-disciplina')
  @ApiRelatorioBinario()
  @ApiQuery({ name: 'materiaId', required: false })
  @ApiQuery({ name: 'alunoId', required: false })
  @ApiQuery({
    name: 'dataInicio',
    required: false,
    description: 'Data no formato ISO (AAAA-MM-DD)',
  })
  @ApiQuery({
    name: 'dataFim',
    required: false,
    description: 'Data no formato ISO (AAAA-MM-DD)',
  })
  @ApiOperation({
    summary: 'Frequência da turma agrupada por disciplina',
    description:
      'Gera o relatório de frequência da turma, agrupado por disciplina, com os mesmos filtros opcionais da versão em JSON.',
  })
  async frequenciaTurmaPorDisciplina(
    @Param('turmaId') turmaId: string,
    @Query('formato') formatoQuery: string | undefined,
    @Query('materiaId') materiaId: string | undefined,
    @Query('alunoId') alunoId: string | undefined,
    @Query('dataInicio') dataInicio: string | undefined,
    @Query('dataFim') dataFim: string | undefined,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const formato = parseFormato(formatoQuery);
    const resultado = await this.service.frequenciaTurmaPorDisciplina(
      turmaId,
      formato,
      user,
      { materiaId, alunoId, dataInicio, dataFim },
    );
    return this.empacotar(resultado, formato);
  }
}
