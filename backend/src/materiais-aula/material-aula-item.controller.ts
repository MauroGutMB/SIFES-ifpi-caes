import { Controller, Delete, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { Role } from '../../generated/prisma/client';
import { MateriaisAulaService } from './materiais-aula.service';

@ApiTags('materiais-aula')
@Roles(Role.ADMIN, Role.PROFESSOR)
@Controller('materiais-aula')
export class MaterialAulaItemController {
  constructor(private readonly service: MateriaisAulaService) {}

  @Delete(':id')
  remover(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.remover(id, user);
  }
}
