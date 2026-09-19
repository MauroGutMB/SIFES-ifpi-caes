import { Controller, Delete, Get, Param, Query } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../../generated/prisma/client';
import { LogsService } from './logs.service';
import { LogAuditoriaDto } from './dto/log-auditoria.dto';
import { LogsRemovidosDto } from './dto/logs-removidos.dto';

@ApiTags('logs')
@Roles(Role.ADMIN)
@Controller('admin/logs')
export class LogsController {
  constructor(private readonly service: LogsService) {}

  @Get()
  @ApiOkResponse({ type: LogAuditoriaDto, isArray: true })
  listar(@Query('semestreId') semestreId?: string): Promise<LogAuditoriaDto[]> {
    return this.service.listar(semestreId);
  }

  @Delete('semestre/:semestreId')
  @ApiOkResponse({ type: LogsRemovidosDto })
  apagarDoSemestre(
    @Param('semestreId') semestreId: string,
  ): Promise<LogsRemovidosDto> {
    return this.service.apagarDoSemestre(semestreId);
  }
}
