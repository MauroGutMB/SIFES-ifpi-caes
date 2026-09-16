import { Body, Controller, Get, Param, Patch, Post, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { Role } from '../../generated/prisma/client';
import { AulasService } from './aulas.service';
import { UpdateAulaDto } from './dto/update-aula.dto';
import { SetFrequenciasDto } from './dto/set-frequencias.dto';
import { OverrideAulaDto } from './dto/override-aula.dto';

@ApiTags('aulas')
@Roles(Role.ADMIN, Role.PROFESSOR)
@Controller('aulas')
export class AulasController {
  constructor(private readonly service: AulasService) {}

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.findOne(id, user);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateAulaDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.update(id, dto, user);
  }

  @Put(':id/frequencias')
  setFrequencias(
    @Param('id') id: string,
    @Body() dto: SetFrequenciasDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.setFrequencias(id, dto, user);
  }

  @Roles(Role.ADMIN)
  @Post(':id/override')
  override(@Param('id') id: string, @Body() dto: OverrideAulaDto) {
    return this.service.override(id, dto);
  }
}
