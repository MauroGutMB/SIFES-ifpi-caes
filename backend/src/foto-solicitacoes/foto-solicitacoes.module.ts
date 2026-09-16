import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { FotoSolicitacoesController } from './foto-solicitacoes.controller';
import { AdminFotoSolicitacoesController } from './admin-foto-solicitacoes.controller';
import { FotoSolicitacoesService } from './foto-solicitacoes.service';

@Module({
  imports: [UsersModule],
  controllers: [FotoSolicitacoesController, AdminFotoSolicitacoesController],
  providers: [FotoSolicitacoesService],
})
export class FotoSolicitacoesModule {}
