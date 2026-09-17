import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../../generated/prisma/client';
import { AdminDashboardService } from './admin-dashboard.service';
import { ContagensDto } from './dto/contagens.dto';

@ApiTags('admin-dashboard')
@Roles(Role.ADMIN)
@Controller('admin/dashboard')
export class AdminDashboardController {
  constructor(private readonly service: AdminDashboardService) {}

  @Get()
  @ApiOkResponse({ type: ContagensDto })
  contagens(): Promise<ContagensDto> {
    return this.service.contagens();
  }
}
