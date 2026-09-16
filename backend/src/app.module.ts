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
import { MateriasModule } from './materias/materias.module';
import { AulasModule } from './aulas/aulas.module';
import { BoletimModule } from './boletim/boletim.module';
import { PlanoDisciplinaModule } from './plano-disciplina/plano-disciplina.module';
import { MateriaisAulaModule } from './materiais-aula/materiais-aula.module';
import { AtividadesModule } from './atividades/atividades.module';
import { AdminDashboardModule } from './admin-dashboard/admin-dashboard.module';
import { RelatoriosModule } from './relatorios/relatorios.module';

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
    MateriasModule,
    AulasModule,
    BoletimModule,
    PlanoDisciplinaModule,
    MateriaisAulaModule,
    AtividadesModule,
    AdminDashboardModule,
    RelatoriosModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
