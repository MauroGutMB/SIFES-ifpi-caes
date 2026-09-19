import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Query,
  StreamableFile,
} from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { Role } from '../../generated/prisma/client';
import { RelatoriosService } from './relatorios.service';
import { RelatorioFrequenciaTurmaDto } from './dto/frequencia-turma-relatorio.dto';
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

@ApiTags('relatorios')
@Controller('relatorios')
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
  async usuarios(@Query('formato') formatoQuery: string | undefined) {
    const formato = parseFormato(formatoQuery);
    const resultado = await this.service.usuariosAtivos(formato);
    return this.empacotar(resultado, formato);
  }

  @Roles(Role.ADMIN, Role.PROFESSOR, Role.ALUNO)
  @Get('turma/:turmaId/frequencia')
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
}
