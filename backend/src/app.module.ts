import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { FotoSolicitacoesModule } from './foto-solicitacoes/foto-solicitacoes.module';
import { SemestresModule } from './semestres/semestres.module';
import { TurmasModule } from './turmas/turmas.module';
import { ProfessoresModule } from './professores/professores.module';
import { AlunosModule } from './alunos/alunos.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    FotoSolicitacoesModule,
    SemestresModule,
    TurmasModule,
    ProfessoresModule,
    AlunosModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
