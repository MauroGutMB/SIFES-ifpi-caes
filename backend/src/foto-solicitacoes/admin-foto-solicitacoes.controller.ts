import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role, StatusSolicitacaoFoto } from '../../generated/prisma/client';
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
  aprovarTodas() {
    return this.service.aprovarTodas();
  }

  @Post(':id/aprovar')
  aprovar(@Param('id') id: string) {
    return this.service.aprovar(id);
  }

  @Post(':id/rejeitar')
  rejeitar(@Param('id') id: string) {
    return this.service.rejeitar(id);
  }
}
