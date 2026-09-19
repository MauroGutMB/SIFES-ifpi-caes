import { Body, Controller, Delete, Param, Patch, Put } from '@nestjs/common';
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
import { LogAcao } from '../logs/log-acao.decorator';
import { PlanoDisciplinaService } from './plano-disciplina.service';
import { UpdateItemAvaliacaoDto } from './dto/update-item-avaliacao.dto';
import { SetNotasDto } from './dto/set-notas.dto';
import { HabilitarItemEspecialDto } from './dto/habilitar-item-especial.dto';
import { AplicarAbaixoMediaDto } from './dto/aplicar-abaixo-media.dto';
import { ApiAutenticado } from '../common/swagger-auth.decorator';

@ApiTags('plano-disciplina')
@Roles(Role.ADMIN, Role.PROFESSOR)
@Controller('itens-avaliacao')
@ApiAutenticado()
export class ItensAvaliacaoController {
  constructor(private readonly service: PlanoDisciplinaService) {}

  @Patch(':id')
  @ApiOperation({
    summary: 'Editar item de avaliação',
    description:
      'Edita um item de avaliação (prova, trabalho) do plano da disciplina.',
  })
  @ApiNotFoundResponse({ description: 'Item de avaliação não encontrado' })
  @ApiBadRequestResponse({ description: 'Disciplina já encerrada' })
  @LogAcao(({ resultado }) => ({
    acao: 'Editou item de avaliação',
    alvo: (resultado as { nome?: string })?.nome ?? 'item de avaliação',
  }))
  atualizar(
    @Param('id') id: string,
    @Body() dto: UpdateItemAvaliacaoDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.atualizarItem(id, dto, user);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Excluir item de avaliação',
    description: 'Exclui um item de avaliação do plano da disciplina.',
  })
  @ApiNotFoundResponse({ description: 'Item de avaliação não encontrado' })
  @ApiBadRequestResponse({ description: 'Disciplina já encerrada' })
  @LogAcao(({ resultado }) => ({
    acao: 'Excluiu item de avaliação',
    alvo: (resultado as { nome?: string })?.nome ?? 'item de avaliação',
  }))
  remover(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.removerItem(id, user);
  }

  @Put(':id/notas')
  @ApiOperation({
    summary: 'Lançar notas do item',
    description:
      'Lança/atualiza a nota de cada aluno para um item de avaliação.',
  })
  @ApiNotFoundResponse({ description: 'Item de avaliação não encontrado' })
  @ApiBadRequestResponse({
    description: 'Disciplina já encerrada, ou aluno não vinculado',
  })
  @LogAcao(({ resultado, body }) => {
    const r = resultado as { itemNome?: string; materiaNome?: string };
    const qtd = (body as { notas?: unknown[] })?.notas?.length ?? 0;
    return {
      acao: 'Lançou notas',
      alvo: `${r?.itemNome ?? 'item'} — ${r?.materiaNome ?? 'disciplina'} (${qtd} aluno(s))`,
    };
  })
  setNotas(
    @Param('id') id: string,
    @Body() dto: SetNotasDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.setNotas(id, dto, user);
  }

  @Put(':id/alunos/:alunoId')
  @ApiOperation({
    summary: 'Habilitar/desabilitar item especial para um aluno',
    description:
      'Marca se um item de avaliação vale (ou não) para um aluno específico — usado para itens "especiais" aplicados seletivamente (ex: prova de recuperação só para quem ficou abaixo da média).',
  })
  @ApiNotFoundResponse({
    description: 'Item de avaliação ou aluno não encontrado',
  })
  @LogAcao(({ body, resultado }) => {
    const r = resultado as { itemNome?: string; alunoNome?: string };
    return {
      acao: (body as { habilitado?: boolean })?.habilitado
        ? 'Habilitou item especial para aluno'
        : 'Desabilitou item especial para aluno',
      alvo: `${r?.itemNome ?? 'item'} — ${r?.alunoNome ?? 'aluno'}`,
    };
  })
  definirItemEspecialAluno(
    @Param('id') id: string,
    @Param('alunoId') alunoId: string,
    @Body() dto: HabilitarItemEspecialDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.definirItemEspecialAluno(
      id,
      alunoId,
      dto.habilitado,
      user,
    );
  }

  @Put(':id/aplicar-abaixo-media')
  @ApiOperation({
    summary: 'Aplicar item especial a todos abaixo da média',
    description:
      'Habilita automaticamente o item especial para todos os alunos da disciplina cuja média está abaixo do mínimo de aprovação, numa única chamada.',
  })
  @ApiNotFoundResponse({ description: 'Item de avaliação não encontrado' })
  @ApiOkResponse({ type: AplicarAbaixoMediaDto })
  @LogAcao(({ resultado }) => ({
    acao: 'Aplicou item especial aos alunos abaixo da média',
    alvo: (resultado as { itemNome?: string })?.itemNome ?? 'item',
  }))
  aplicarAbaixoMedia(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.aplicarItemEspecialAbaixoMedia(id, user);
  }
}
