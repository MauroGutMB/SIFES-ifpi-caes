import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LoggerMiddleware } from './common/logger.middleware';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { FotoSolicitacoesModule } from './foto-solicitacoes/foto-solicitacoes.module';
import { SemestresModule } from './semestres/semestres.module';
import { TurmasModule } from './turmas/turmas.module';
import { ProfessoresModule } from './professores/professores.module';
import { AlunosModule } from './alunos/alunos.module';
import { MateriasModule } from './materias/materias.module';
import { AulasModule } from './aulas/aulas.module';
import { BoletimModule } from './boletim/boletim.module';
import { PlanoDisciplinaModule } from './plano-disciplina/plano-disciplina.module';
import { MateriaisAulaModule } from './materiais-aula/materiais-aula.module';
import { AtividadesModule } from './atividades/atividades.module';
import { AdminDashboardModule } from './admin-dashboard/admin-dashboard.module';
import { RelatoriosModule } from './relatorios/relatorios.module';
import { ArquivosModule } from './arquivos/arquivos.module';
import { PendenciasModule } from './pendencias/pendencias.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Bucket 'default' cobre a API em geral. A contagem do ThrottlerGuard é por
    // Controller+Handler+IP (não por bucket sozinho), então @Throttle({ default: {...} })
    // no AuthController sobrescreve o limite só para login/refresh, sem afetar o resto da
    // API — login é o alvo de brute-force aqui (matrícula do aluno é previsível, 8 dígitos).
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 100 }]),
    PrismaModule,
    AuthModule,
    UsersModule,
    FotoSolicitacoesModule,
    SemestresModule,
    TurmasModule,
    ProfessoresModule,
    AlunosModule,
    MateriasModule,
    AulasModule,
    BoletimModule,
    PlanoDisciplinaModule,
    MateriaisAulaModule,
    AtividadesModule,
    AdminDashboardModule,
    RelatoriosModule,
    ArquivosModule,
    PendenciasModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
