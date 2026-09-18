import { Body, Controller, Delete, Param, Patch, Put } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { Role } from '../../generated/prisma/client';
import { PlanoDisciplinaService } from './plano-disciplina.service';
import { UpdateItemAvaliacaoDto } from './dto/update-item-avaliacao.dto';
import { SetNotasDto } from './dto/set-notas.dto';
import { HabilitarItemEspecialDto } from './dto/habilitar-item-especial.dto';
import { AplicarAbaixoMediaDto } from './dto/aplicar-abaixo-media.dto';

@ApiTags('plano-disciplina')
@Roles(Role.ADMIN, Role.PROFESSOR)
@Controller('itens-avaliacao')
export class ItensAvaliacaoController {
  constructor(private readonly service: PlanoDisciplinaService) {}

  @Patch(':id')
  atualizar(
    @Param('id') id: string,
    @Body() dto: UpdateItemAvaliacaoDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.atualizarItem(id, dto, user);
  }

  @Delete(':id')
  remover(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.removerItem(id, user);
  }

  @Put(':id/notas')
  setNotas(
    @Param('id') id: string,
    @Body() dto: SetNotasDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.setNotas(id, dto, user);
  }

  @Put(':id/alunos/:alunoId')
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
  @ApiOkResponse({ type: AplicarAbaixoMediaDto })
  aplicarAbaixoMedia(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.aplicarItemEspecialAbaixoMedia(id, user);
  }
}
