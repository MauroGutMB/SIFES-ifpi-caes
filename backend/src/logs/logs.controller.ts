import { Controller, Delete, Get, Param, Query } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../../generated/prisma/client';
import { LogsService } from './logs.service';
import { LogAuditoriaDto } from './dto/log-auditoria.dto';
import { LogsRemovidosDto } from './dto/logs-removidos.dto';
import { ApiAutenticado } from '../common/swagger-auth.decorator';

@ApiTags('logs')
@Roles(Role.ADMIN)
@Controller('admin/logs')
@ApiAutenticado()
export class LogsController {
  constructor(private readonly service: LogsService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar logs de auditoria',
    description:
      'Lista as ações administrativas registradas, com filtro opcional por semestre.',
  })
  @ApiQuery({ name: 'semestreId', required: false })
  @ApiOkResponse({ type: LogAuditoriaDto, isArray: true })
  listar(@Query('semestreId') semestreId?: string): Promise<LogAuditoriaDto[]> {
    return this.service.listar(semestreId);
  }

  @Delete('semestre/:semestreId')
  @ApiOperation({
    summary: 'Apagar logs de um semestre',
    description:
      'Apaga permanentemente todos os logs de auditoria vinculados a um semestre.',
  })
  @ApiOkResponse({ type: LogsRemovidosDto })
  apagarDoSemestre(
    @Param('semestreId') semestreId: string,
  ): Promise<LogsRemovidosDto> {
    return this.service.apagarDoSemestre(semestreId);
  }
}
