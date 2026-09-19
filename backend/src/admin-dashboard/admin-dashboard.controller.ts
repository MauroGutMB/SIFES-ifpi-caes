import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../../generated/prisma/client';
import { AdminDashboardService } from './admin-dashboard.service';
import { ContagensDto } from './dto/contagens.dto';
import { ApiAutenticado } from '../common/swagger-auth.decorator';

@ApiTags('admin-dashboard')
@Roles(Role.ADMIN)
@Controller('admin/dashboard')
@ApiAutenticado()
export class AdminDashboardController {
  constructor(private readonly service: AdminDashboardService) {}

  @Get()
  @ApiOperation({
    summary: 'Contagens do painel admin',
    description:
      'Retorna os números resumo exibidos no painel do admin: totais de professores e alunos, alunos sem turma, disciplinas do semestre atual, alunos com pendência e fotos aguardando aprovação. Restrito ao admin.',
  })
  @ApiOkResponse({ type: ContagensDto })
  contagens(): Promise<ContagensDto> {
    return this.service.contagens();
  }
}
