import { Body, Controller, Get, Param, Patch, Post, Put } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { Role } from '../../generated/prisma/client';
import { AulasService } from './aulas.service';
import { UpdateAulaDto } from './dto/update-aula.dto';
import { SetFrequenciasDto } from './dto/set-frequencias.dto';
import { OverrideAulaDto } from './dto/override-aula.dto';
import { AulaDetalheDto, FrequenciaComAlunoDto } from './dto/aula-detalhe.dto';
import { ApiAutenticado } from '../common/swagger-auth.decorator';

@ApiTags('aulas')
@Roles(Role.ADMIN, Role.PROFESSOR)
@Controller('aulas')
@ApiAutenticado()
export class AulasController {
  constructor(private readonly service: AulasService) {}

  @Get(':id')
  @ApiOperation({
    summary: 'Detalhes de uma aula',
    description:
      'Retorna os dados de uma aula, incluindo a frequência lançada de cada aluno vinculado à disciplina. Professor só acessa aulas das próprias disciplinas.',
  })
  @ApiNotFoundResponse({ description: 'Aula não encontrada' })
  @ApiOkResponse({ type: AulaDetalheDto })
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<AulaDetalheDto> {
    return this.service.findOne(id, user);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Editar título/descrição de uma aula',
    description:
      'Edita título e descrição de uma aula já ocorrida. Não permite editar aula com data futura.',
  })
  @ApiNotFoundResponse({ description: 'Aula não encontrada' })
  @ApiBadRequestResponse({ description: 'Aula tem data futura' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateAulaDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.update(id, dto, user);
  }

  @Put(':id/frequencias')
  @ApiOperation({
    summary: 'Lançar frequência da aula',
    description:
      'Define/atualiza a presença de cada aluno vinculado à disciplina nesta aula. Bloqueado para aula com data futura ou disciplina já encerrada.',
  })
  @ApiNotFoundResponse({ description: 'Aula não encontrada' })
  @ApiBadRequestResponse({
    description:
      'Aula tem data futura, disciplina encerrada, ou aluno não vinculado',
  })
  @ApiOkResponse({ type: FrequenciaComAlunoDto, isArray: true })
  setFrequencias(
    @Param('id') id: string,
    @Body() dto: SetFrequenciasDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<FrequenciaComAlunoDto[]> {
    return this.service.setFrequencias(id, dto, user);
  }

  @Roles(Role.ADMIN)
  @Post(':id/override')
  @ApiOperation({
    summary: 'Override administrativo do estado de uma aula',
    description:
      'Ação exclusiva de admin: sobrescreve manualmente o estado calculado (por horário) de uma aula, para correções pontuais.',
  })
  @ApiNotFoundResponse({ description: 'Aula não encontrada' })
  override(@Param('id') id: string, @Body() dto: OverrideAulaDto) {
    return this.service.override(id, dto);
  }
}
