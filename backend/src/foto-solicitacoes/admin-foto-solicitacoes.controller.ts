import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role, StatusSolicitacaoFoto } from '../../generated/prisma/client';
import { LogAcao } from '../logs/log-acao.decorator';
import { FotoSolicitacoesService } from './foto-solicitacoes.service';
import { SolicitacaoFotoDto } from './dto/solicitacao-foto.dto';

@ApiTags('admin-foto-solicitacoes')
@Roles(Role.ADMIN)
@Controller('admin/foto-solicitacoes')
export class AdminFotoSolicitacoesController {
  constructor(private readonly service: FotoSolicitacoesService) {}

  @Get()
  @ApiOkResponse({ type: SolicitacaoFotoDto, isArray: true })
  listar(
    @Query('status') status?: StatusSolicitacaoFoto,
  ): Promise<SolicitacaoFotoDto[]> {
    return this.service.listar(status);
  }

  @Post('aprovar-todas')
  @LogAcao(({ resultado }) => ({
    acao: 'Aprovou todas as solicitações de foto',
    alvo: `${(resultado as unknown[])?.length ?? 0} solicitação(ões)`,
  }))
  aprovarTodas() {
    return this.service.aprovarTodas();
  }

  @Post(':id/aprovar')
  @LogAcao(({ resultado }) => ({
    acao: 'Aprovou solicitação de foto',
    alvo: (resultado as { alunoNome?: string })?.alunoNome ?? 'aluno',
  }))
  aprovar(@Param('id') id: string) {
    return this.service.aprovar(id);
  }

  @Post(':id/rejeitar')
  @LogAcao(({ resultado }) => ({
    acao: 'Rejeitou solicitação de foto',
    alvo: (resultado as { alunoNome?: string })?.alunoNome ?? 'aluno',
  }))
  rejeitar(@Param('id') id: string) {
    return this.service.rejeitar(id);
  }
}
