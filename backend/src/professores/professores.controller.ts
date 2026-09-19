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
import { ProfessoresService } from './professores.service';
import { CreateProfessorDto } from './dto/create-professor.dto';
import { UpdateProfessorDto } from './dto/update-professor.dto';
import { ProfessorCriadoDto, ProfessorDto } from './dto/professor.dto';
import { ApiAutenticado } from '../common/swagger-auth.decorator';

@ApiTags('professores')
@Roles(Role.ADMIN)
@Controller('professores')
@ApiAutenticado()
export class ProfessoresController {
  constructor(private readonly service: ProfessoresService) {}

  @Post()
  @ApiOperation({
    summary: 'Cria professor',
    description:
      'Cria um professor e a conta de login vinculada (login = e-mail), com senha inicial gerada — retornada uma única vez na resposta. Restrito ao admin.',
  })
  @ApiOkResponse({ type: ProfessorCriadoDto })
  create(@Body() dto: CreateProfessorDto): Promise<ProfessorCriadoDto> {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Lista professores',
    description:
      'Retorna todos os professores, com a foto de perfil. Restrito ao admin.',
  })
  @ApiOkResponse({ type: ProfessorDto, isArray: true })
  findAll(): Promise<ProfessorDto[]> {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Busca professor por id',
    description:
      'Retorna um professor específico, incluindo as disciplinas que leciona. Restrito ao admin.',
  })
  @ApiNotFoundResponse({ description: 'Professor não encontrado' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Edita professor',
    description:
      'Atualiza nome e/ou e-mail do professor; ao trocar o e-mail, o login da conta é atualizado junto. Restrito ao admin.',
  })
  @ApiNotFoundResponse({ description: 'Professor não encontrado' })
  @LogAcao(({ resultado }) => ({
    acao: 'Editou professor',
    alvo: (resultado as { nome?: string })?.nome ?? 'professor',
  }))
  update(@Param('id') id: string, @Body() dto: UpdateProfessorDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Exclui professor',
    description:
      'Remove o professor e a conta de login vinculada (a exclusão do usuário cascateia para o professor). Restrito ao admin.',
  })
  @ApiNotFoundResponse({ description: 'Professor não encontrado' })
  @LogAcao(({ resultado }) => ({
    acao: 'Excluiu professor',
    alvo: (resultado as { nome?: string })?.nome ?? 'professor',
  }))
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
