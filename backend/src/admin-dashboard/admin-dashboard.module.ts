import { Module } from '@nestjs/common';
import { BoletimModule } from '../boletim/boletim.module';
import { PendenciasModule } from '../pendencias/pendencias.module';
import { AdminDashboardController } from './admin-dashboard.controller';
import { AdminDashboardService } from './admin-dashboard.service';

@Module({
  imports: [BoletimModule, PendenciasModule],
  controllers: [AdminDashboardController],
  providers: [AdminDashboardService],
})
export class AdminDashboardModule {}
