import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role, StatusSolicitacaoFoto } from '../../generated/prisma/client';
import { LogAcao } from '../logs/log-acao.decorator';
import { FotoSolicitacoesService } from './foto-solicitacoes.service';
import { SolicitacaoFotoDto } from './dto/solicitacao-foto.dto';
import { ApiAutenticado } from '../common/swagger-auth.decorator';

@ApiTags('admin-foto-solicitacoes')
@Roles(Role.ADMIN)
@Controller('admin/foto-solicitacoes')
@ApiAutenticado()
export class AdminFotoSolicitacoesController {
  constructor(private readonly service: FotoSolicitacoesService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar solicitações de foto',
    description:
      'Lista as solicitações de troca de foto, com filtro opcional por status (padrão: PENDENTE).',
  })
  @ApiOkResponse({ type: SolicitacaoFotoDto, isArray: true })
  listar(
    @Query('status') status?: StatusSolicitacaoFoto,
  ): Promise<SolicitacaoFotoDto[]> {
    return this.service.listar(status);
  }

  @Post('aprovar-todas')
  @ApiOperation({
    summary: 'Aprovar todas as solicitações pendentes',
    description:
      'Aprova, de uma vez, todas as solicitações de foto ainda PENDENTES.',
  })
  @LogAcao(({ resultado }) => ({
    acao: 'Aprovou todas as solicitações de foto',
    alvo: `${(resultado as unknown[])?.length ?? 0} solicitação(ões)`,
  }))
  aprovarTodas() {
    return this.service.aprovarTodas();
  }

  @Post(':id/aprovar')
  @ApiOperation({
    summary: 'Aprovar solicitação de foto',
    description:
      'Aprova uma solicitação: troca a foto de perfil do aluno e apaga o arquivo de staging. A reivindicação é atômica — uma solicitação já resolvida (por outra chamada concorrente ou anteriormente) retorna erro em vez de aprovar de novo.',
  })
  @ApiNotFoundResponse({ description: 'Solicitação não encontrada' })
  @ApiBadRequestResponse({ description: 'Solicitação já foi resolvida' })
  @LogAcao(({ resultado }) => ({
    acao: 'Aprovou solicitação de foto',
    alvo: (resultado as { alunoNome?: string })?.alunoNome ?? 'aluno',
  }))
  aprovar(@Param('id') id: string) {
    return this.service.aprovar(id);
  }

  @Post(':id/rejeitar')
  @ApiOperation({
    summary: 'Rejeitar solicitação de foto',
    description:
      'Rejeita uma solicitação de foto pendente, descartando o arquivo enviado.',
  })
  @ApiNotFoundResponse({ description: 'Solicitação não encontrada' })
  @ApiBadRequestResponse({ description: 'Solicitação já foi resolvida' })
  @LogAcao(({ resultado }) => ({
    acao: 'Rejeitou solicitação de foto',
    alvo: (resultado as { alunoNome?: string })?.alunoNome ?? 'aluno',
  }))
  rejeitar(@Param('id') id: string) {
    return this.service.rejeitar(id);
  }
}
