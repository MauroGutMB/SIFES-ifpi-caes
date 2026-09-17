import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { Role } from '../../generated/prisma/client';
import { PlanoDisciplinaService } from './plano-disciplina.service';
import { CreateItemAvaliacaoDto } from './dto/create-item-avaliacao.dto';
import { ItemAvaliacaoDto } from './dto/item-avaliacao.dto';
import { BoletimLinhaDto } from './dto/boletim-linha.dto';
import { ItemDetalhadoDto } from './dto/item-detalhado.dto';

@ApiTags('plano-disciplina')
@Roles(Role.ADMIN, Role.PROFESSOR)
@Controller('materias/:materiaId')
export class MateriaPlanoController {
  constructor(private readonly service: PlanoDisciplinaService) {}

  @Post('itens-avaliacao')
  criarItem(
    @Param('materiaId') materiaId: string,
    @Body() dto: CreateItemAvaliacaoDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.criarItem(materiaId, dto, user);
  }

  @Get('itens-avaliacao')
  @ApiOkResponse({ type: ItemAvaliacaoDto, isArray: true })
  listarItens(
    @Param('materiaId') materiaId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ItemAvaliacaoDto[]> {
    return this.service.listarItens(materiaId, user);
  }

  @Roles(Role.ADMIN, Role.PROFESSOR, Role.ALUNO)
  @Get('boletim')
  @ApiOkResponse({ type: BoletimLinhaDto, isArray: true })
  boletim(
    @Param('materiaId') materiaId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<BoletimLinhaDto[]> {
    return this.service.boletimMateria(materiaId, user);
  }

  @Get('alunos/:alunoId/detalhamento')
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
  @ApiOkResponse({ type: ItemDetalhadoDto, isArray: true })
  meuDetalhamento(
    @Param('materiaId') materiaId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ItemDetalhadoDto[]> {
    return this.service.meuDetalhamento(materiaId, user);
  }
}
