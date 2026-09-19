import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
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
import { SemestresService } from './semestres.service';
import { CreateSemestreDto } from './dto/create-semestre.dto';
import { UpdateSemestreDto } from './dto/update-semestre.dto';
import { SemestreDto } from './dto/semestre.dto';
import { ApiAutenticado } from '../common/swagger-auth.decorator';

@ApiTags('semestres')
@Roles(Role.ADMIN)
@Controller('semestres')
@ApiAutenticado()
export class SemestresController {
  constructor(private readonly service: SemestresService) {}

  @Post()
  @ApiOperation({
    summary: 'Cria semestre',
    description:
      'Cria um semestre letivo, com validação de que a data de fim é posterior à de início. Restrito ao admin.',
  })
  @ApiOkResponse({ type: SemestreDto })
  create(@Body() dto: CreateSemestreDto): Promise<SemestreDto> {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Lista semestres',
    description:
      'Retorna todos os semestres, do mais recente para o mais antigo. Restrito ao admin.',
  })
  @ApiOkResponse({ type: SemestreDto, isArray: true })
  findAll(): Promise<SemestreDto[]> {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Busca semestre por id',
    description: 'Retorna um semestre específico. Restrito ao admin.',
  })
  @ApiNotFoundResponse({ description: 'Semestre não encontrado' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Edita semestre',
    description:
      'Atualiza nome e/ou datas do semestre. Se as datas mudarem, regenera automaticamente as aulas de todas as disciplinas vinculadas para refletir o novo intervalo, sem apagar lançamentos de aulas que continuam válidas. Restrito ao admin.',
  })
  @ApiNotFoundResponse({ description: 'Semestre não encontrado' })
  @LogAcao(({ resultado }) => ({
    acao: 'Editou semestre',
    alvo: (resultado as { nome?: string })?.nome ?? 'semestre',
  }))
  update(@Param('id') id: string, @Body() dto: UpdateSemestreDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Exclui semestre',
    description: 'Remove o semestre. Restrito ao admin.',
  })
  @ApiNotFoundResponse({ description: 'Semestre não encontrado' })
  @LogAcao(({ resultado }) => ({
    acao: 'Excluiu semestre',
    alvo: (resultado as { nome?: string })?.nome ?? 'semestre',
  }))
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
