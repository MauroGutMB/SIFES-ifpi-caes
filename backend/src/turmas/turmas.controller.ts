import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../../generated/prisma/client';
import { LogAcao } from '../logs/log-acao.decorator';
import { TurmasService } from './turmas.service';
import { CreateTurmaDto } from './dto/create-turma.dto';
import { UpdateTurmaDto } from './dto/update-turma.dto';
import { TurmaDto } from './dto/turma.dto';
import { ApiAutenticado } from '../common/swagger-auth.decorator';

@ApiTags('turmas')
@Roles(Role.ADMIN)
@Controller('turmas')
@ApiAutenticado()
export class TurmasController {
  constructor(private readonly service: TurmasService) {}

  @Post()
  @ApiOperation({
    summary: 'Cria turma',
    description:
      'Cria uma turma vinculada a um semestre existente. Restrito ao admin.',
  })
  @ApiNotFoundResponse({ description: 'Semestre não encontrado' })
  create(@Body() dto: CreateTurmaDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Lista turmas',
    description:
      'Retorna todas as turmas, com o semestre vinculado. Filtra por semestre via query, se informado. Restrito ao admin.',
  })
  @ApiOkResponse({ type: TurmaDto, isArray: true })
  findAll(@Query('semestreId') semestreId?: string): Promise<TurmaDto[]> {
    return this.service.findAll(semestreId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Busca turma por id',
    description:
      'Retorna uma turma específica, incluindo o semestre e as disciplinas vinculadas. Restrito ao admin.',
  })
  @ApiNotFoundResponse({ description: 'Turma não encontrada' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Edita turma',
    description:
      'Atualiza os dados da turma; ao trocar o semestre vinculado, valida que o novo semestre existe. Restrito ao admin.',
  })
  @ApiNotFoundResponse({ description: 'Turma ou semestre não encontrado' })
  @LogAcao(({ resultado }) => {
    const r = resultado as { cursoTecnico?: string; anoSerie?: string };
    return {
      acao: 'Editou turma',
      alvo: `${r?.cursoTecnico ?? ''} ${r?.anoSerie ?? ''}`.trim() || 'turma',
    };
  })
  update(@Param('id') id: string, @Body() dto: UpdateTurmaDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Exclui turma',
    description: 'Remove a turma. Restrito ao admin.',
  })
  @ApiNotFoundResponse({ description: 'Turma não encontrada' })
  @LogAcao(({ resultado }) => {
    const r = resultado as { cursoTecnico?: string; anoSerie?: string };
    return {
      acao: 'Excluiu turma',
      alvo: `${r?.cursoTecnico ?? ''} ${r?.anoSerie ?? ''}`.trim() || 'turma',
    };
  })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
