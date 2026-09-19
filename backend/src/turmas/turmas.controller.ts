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
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../../generated/prisma/client';
import { LogAcao } from '../logs/log-acao.decorator';
import { TurmasService } from './turmas.service';
import { CreateTurmaDto } from './dto/create-turma.dto';
import { UpdateTurmaDto } from './dto/update-turma.dto';
import { TurmaDto } from './dto/turma.dto';

@ApiTags('turmas')
@Roles(Role.ADMIN)
@Controller('turmas')
export class TurmasController {
  constructor(private readonly service: TurmasService) {}

  @Post()
  create(@Body() dto: CreateTurmaDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOkResponse({ type: TurmaDto, isArray: true })
  findAll(@Query('semestreId') semestreId?: string): Promise<TurmaDto[]> {
    return this.service.findAll(semestreId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
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
