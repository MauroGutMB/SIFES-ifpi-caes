import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Put,
  Query,
  StreamableFile,
} from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiProduces,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../../generated/prisma/client';
import { LogAcao } from '../logs/log-acao.decorator';
import { PendenciasService } from './pendencias.service';
import { PendenciaAlunoDto } from './dto/pendencia-aluno.dto';
import { PendenciaDetalheDto } from './dto/pendencia-detalhe.dto';
import { ResolverTodasDto } from './dto/resolver-todas.dto';
import { ApiAutenticado } from '../common/swagger-auth.decorator';
import {
  extensaoParaFormato,
  Formato,
  mimeParaFormato,
} from '../relatorios/report-render.util';

function parseFormato(formato?: string): Formato {
  if (formato === undefined || formato === 'pdf') return 'pdf';
  if (formato === 'xlsx') return 'xlsx';
  throw new BadRequestException('formato deve ser "pdf" ou "xlsx"');
}

function parseStatus(status?: string): 'PENDENTE' | 'RESOLVIDA' {
  if (status === 'RESOLVIDA') return 'RESOLVIDA';
  if (status === undefined || status === 'PENDENTE') return 'PENDENTE';
  throw new BadRequestException('status deve ser "PENDENTE" ou "RESOLVIDA"');
}

@ApiTags('pendencias')
@Roles(Role.ADMIN)
@Controller('admin/pendencias')
@ApiAutenticado()
export class PendenciasController {
  constructor(private readonly service: PendenciasService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar pendências',
    description:
      'Lista os alunos com pendência acadêmica (reprovação numa disciplina já encerrada), agrupados por aluno. A pendência é calculada ao vivo a partir do boletim, nunca armazenada — o único dado persistido é a marcação de "resolvida".',
  })
  @ApiQuery({
    name: 'status',
    enum: ['PENDENTE', 'RESOLVIDA'],
    required: false,
  })
  @ApiOkResponse({ type: PendenciaAlunoDto, isArray: true })
  listar(@Query('status') status?: string): Promise<PendenciaAlunoDto[]> {
    return this.service.listarPorStatus(parseStatus(status));
  }

  @Get('relatorio')
  @ApiOperation({
    summary: 'Relatório de pendências',
    description:
      'Gera o relatório de pendências (PDF ou Excel), filtrado por status.',
  })
  @ApiProduces(
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  )
  @ApiQuery({
    name: 'formato',
    enum: ['pdf', 'xlsx'],
    required: false,
    description: 'Formato do arquivo gerado. Padrão: "pdf".',
  })
  @ApiQuery({
    name: 'status',
    enum: ['PENDENTE', 'RESOLVIDA'],
    required: false,
  })
  @ApiOkResponse({
    description: 'Arquivo binário para download — não é JSON.',
    schema: { type: 'string', format: 'binary' },
  })
  async relatorio(
    @Query('formato') formatoQuery?: string,
    @Query('status') statusQuery?: string,
  ) {
    const formato = parseFormato(formatoQuery);
    const status = parseStatus(statusQuery);
    const resultado = await this.service.relatorio(formato, status);
    return new StreamableFile(resultado.buffer, {
      type: mimeParaFormato(formato),
      disposition: `attachment; filename="${resultado.nomeBase}.${extensaoParaFormato(formato)}"`,
    });
  }

  @Get(':alunoId')
  @ApiOperation({
    summary: 'Pendências de um aluno',
    description:
      'Detalha todas as pendências (pendentes e resolvidas) de um aluno específico.',
  })
  @ApiOkResponse({ type: PendenciaDetalheDto, isArray: true })
  pendenciasDoAluno(
    @Param('alunoId') alunoId: string,
  ): Promise<PendenciaDetalheDto[]> {
    return this.service.pendenciasDoAluno(alunoId);
  }

  @Put(':alunoId/:materiaId/resolver')
  @ApiOperation({
    summary: 'Resolver uma pendência',
    description:
      'Marca que a pendência de um aluno numa disciplina específica já foi tratada — a nota não muda, só o status de "conhecimento" do admin. Idempotente: chamar de novo não falha.',
  })
  @LogAcao(({ resultado }) => {
    const r = resultado as { alunoNome?: string; materiaNome?: string };
    return {
      acao: 'Resolveu pendência',
      alvo: `${r?.alunoNome ?? 'aluno'} — ${r?.materiaNome ?? 'disciplina'}`,
    };
  })
  resolver(
    @Param('alunoId') alunoId: string,
    @Param('materiaId') materiaId: string,
  ) {
    return this.service.resolver(alunoId, materiaId);
  }

  @Put(':alunoId/resolver-todas')
  @ApiOperation({
    summary: 'Resolver todas as pendências de um aluno',
    description:
      'Marca de uma vez todas as pendências ainda pendentes de um aluno como resolvidas.',
  })
  @ApiOkResponse({ type: ResolverTodasDto })
  @LogAcao(({ resultado }) => {
    const r = resultado as { alunoNome?: string; resolvidas?: number };
    return {
      acao: 'Resolveu todas as pendências do aluno',
      alvo: `${r?.alunoNome ?? 'aluno'} — ${r?.resolvidas ?? 0} pendência(s)`,
    };
  })
  resolverTodas(@Param('alunoId') alunoId: string): Promise<ResolverTodasDto> {
    return this.service.resolverTodasDoAluno(alunoId);
  }
}
