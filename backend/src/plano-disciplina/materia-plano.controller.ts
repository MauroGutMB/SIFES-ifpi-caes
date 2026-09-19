import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
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
import { PlanoDisciplinaService } from './plano-disciplina.service';
import { CreateItemAvaliacaoDto } from './dto/create-item-avaliacao.dto';
import { ItemAvaliacaoDto } from './dto/item-avaliacao.dto';
import { BoletimLinhaDto } from './dto/boletim-linha.dto';
import { ItemDetalhadoDto } from './dto/item-detalhado.dto';
import { ConfigurarRegraDto } from './dto/configurar-regra.dto';
import { ApiAutenticado } from '../common/swagger-auth.decorator';

@ApiTags('plano-disciplina')
@Roles(Role.ADMIN, Role.PROFESSOR)
@Controller('materias/:materiaId')
@ApiAutenticado()
export class MateriaPlanoController {
  constructor(private readonly service: PlanoDisciplinaService) {}

  @Post('itens-avaliacao')
  @ApiOperation({
    summary: 'Criar item de avaliação',
    description:
      'Cria um item de avaliação (prova, trabalho) no plano da disciplina, com peso e valor máximo.',
  })
  @ApiNotFoundResponse({ description: 'Disciplina não encontrada' })
  @ApiBadRequestResponse({ description: 'Disciplina já encerrada' })
  criarItem(
    @Param('materiaId') materiaId: string,
    @Body() dto: CreateItemAvaliacaoDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.criarItem(materiaId, dto, user);
  }

  @Get('itens-avaliacao')
  @ApiOperation({
    summary: 'Listar itens de avaliação',
    description:
      'Lista os itens de avaliação cadastrados no plano da disciplina.',
  })
  @ApiNotFoundResponse({ description: 'Disciplina não encontrada' })
  @ApiOkResponse({ type: ItemAvaliacaoDto, isArray: true })
  listarItens(
    @Param('materiaId') materiaId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ItemAvaliacaoDto[]> {
    return this.service.listarItens(materiaId, user);
  }

  @Put('regra-aprovacao')
  @ApiOperation({
    summary: 'Configurar regra de aprovação',
    description:
      'Define a nota mínima de aprovação e o cálculo de média usados no boletim da disciplina.',
  })
  @ApiNotFoundResponse({ description: 'Disciplina não encontrada' })
  @ApiOkResponse({ type: ItemAvaliacaoDto, isArray: true })
  configurarRegra(
    @Param('materiaId') materiaId: string,
    @Body() dto: ConfigurarRegraDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ItemAvaliacaoDto[]> {
    return this.service.configurarRegra(materiaId, dto, user);
  }

  @Roles(Role.ADMIN, Role.PROFESSOR, Role.ALUNO)
  @Get('boletim')
  @ApiOperation({
    summary: 'Boletim da disciplina',
    description:
      'Retorna a nota final, situação (cursando/aprovado/reprovado) e frequência de cada aluno vinculado à disciplina. Aluno só enxerga a própria linha (verificado no service).',
  })
  @ApiNotFoundResponse({ description: 'Disciplina não encontrada' })
  @ApiOkResponse({ type: BoletimLinhaDto, isArray: true })
  boletim(
    @Param('materiaId') materiaId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<BoletimLinhaDto[]> {
    return this.service.boletimMateria(materiaId, user);
  }

  @Get('alunos/:alunoId/detalhamento')
  @ApiOperation({
    summary: 'Notas detalhadas de um aluno',
    description:
      'Detalha, item por item, as notas lançadas para um aluno específico na disciplina — usado pelo professor para editar notas já lançadas sem abrir item por item.',
  })
  @ApiNotFoundResponse({ description: 'Disciplina ou aluno não encontrado' })
  @ApiOkResponse({ type: ItemDetalhadoDto, isArray: true })
  detalhamentoAluno(
    @Param('materiaId') materiaId: string,
    @Param('alunoId') alunoId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ItemDetalhadoDto[]> {
    return this.service.detalhamentoAluno(materiaId, alunoId, user);
  }

  @Roles(Role.ALUNO)
  @Get('meu-detalhamento')
  @ApiOperation({
    summary: 'Minhas notas detalhadas',
    description:
      'Detalha, item por item, as próprias notas do aluno autenticado na disciplina.',
  })
  @ApiNotFoundResponse({ description: 'Disciplina não encontrada' })
  @ApiOkResponse({ type: ItemDetalhadoDto, isArray: true })
  meuDetalhamento(
    @Param('materiaId') materiaId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ItemDetalhadoDto[]> {
    return this.service.meuDetalhamento(materiaId, user);
  }
}
