import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Put,
  Query,
  StreamableFile,
} from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../../generated/prisma/client';
import { LogAcao } from '../logs/log-acao.decorator';
import { PendenciasService } from './pendencias.service';
import { PendenciaAlunoDto } from './dto/pendencia-aluno.dto';
import { PendenciaDetalheDto } from './dto/pendencia-detalhe.dto';
import { ResolverTodasDto } from './dto/resolver-todas.dto';
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
export class PendenciasController {
  constructor(private readonly service: PendenciasService) {}

  @Get()
  @ApiOkResponse({ type: PendenciaAlunoDto, isArray: true })
  listar(@Query('status') status?: string): Promise<PendenciaAlunoDto[]> {
    return this.service.listarPorStatus(parseStatus(status));
  }

  @Get('relatorio')
  async relatorio(@Query('formato') formatoQuery?: string) {
    const formato = parseFormato(formatoQuery);
    const resultado = await this.service.relatorio(formato);
    return new StreamableFile(resultado.buffer, {
      type: mimeParaFormato(formato),
      disposition: `attachment; filename="${resultado.nomeBase}.${extensaoParaFormato(formato)}"`,
    });
  }

  @Get(':alunoId')
  @ApiOkResponse({ type: PendenciaDetalheDto, isArray: true })
  pendenciasDoAluno(
    @Param('alunoId') alunoId: string,
  ): Promise<PendenciaDetalheDto[]> {
    return this.service.pendenciasDoAluno(alunoId);
  }

  @Put(':alunoId/:materiaId/resolver')
  @LogAcao(({ params }) => ({
    acao: 'Resolveu pendência',
    alvo: `aluno ${params.alunoId} — disciplina ${params.materiaId}`,
  }))
  resolver(
    @Param('alunoId') alunoId: string,
    @Param('materiaId') materiaId: string,
  ) {
    return this.service.resolver(alunoId, materiaId);
  }

  @Put(':alunoId/resolver-todas')
  @ApiOkResponse({ type: ResolverTodasDto })
  @LogAcao(({ params, resultado }) => ({
    acao: 'Resolveu todas as pendências do aluno',
    alvo: `aluno ${params.alunoId} — ${(resultado as { resolvidas?: number })?.resolvidas ?? 0} pendência(s)`,
  }))
  resolverTodas(@Param('alunoId') alunoId: string): Promise<ResolverTodasDto> {
    return this.service.resolverTodasDoAluno(alunoId);
  }
}
