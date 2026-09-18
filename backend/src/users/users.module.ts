import { Module } from '@nestjs/common';
import { AlunosModule } from '../alunos/alunos.module';
import { ProfessoresModule } from '../professores/professores.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [AlunosModule, ProfessoresModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
