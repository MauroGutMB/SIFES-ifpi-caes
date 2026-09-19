import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { PrismaExceptionFilter } from '../src/common/prisma-exception.filter';

/**
 * Testes de integração de permissão — cada papel só acessa o que pode, e um professor nunca
 * enxerga o recurso de outro (404, não 403, pra não vazar a existência do recurso — ver
 * common/posse.util.ts). Cobre o que os unit tests com Prisma mockado não cobrem: o guard de
 * roles real (@Roles/RolesGuard), o fluxo de JWT real, e a checagem de posse batendo no banco
 * de verdade, tudo junto.
 */
describe('Permissões entre papéis (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  const sufixo = Date.now();
  const senha = 'e2e-teste-123';

  let adminToken: string;
  let professorAToken: string;
  let professorBToken: string;
  let alunoToken: string;

  const userIds: string[] = [];
  let semestreId: string;
  let turmaId: string;
  let materiaDoProfessorAId: string;

  // Cria só o User (sem logar ainda) — logar antes de vincular Professor/Aluno gravaria
  // professorId/alunoId undefined no JWT pra sempre, já que esse claim vem de user.professor?.id
  // /user.aluno?.id lidos no momento exato do login (ver auth.service.ts).
  async function criarUsuarioSemLogin(
    login: string,
    role: 'ADMIN' | 'PROFESSOR' | 'ALUNO',
  ) {
    const senhaHash = await bcrypt.hash(senha, 10);
    const user = await prisma.user.create({
      data: { login, senhaHash, role, precisaTrocarSenha: false },
    });
    userIds.push(user.id);
    return user.id;
  }

  async function login(loginStr: string) {
    const resposta = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ login: loginStr, senha });
    return (resposta.body as { accessToken: string }).accessToken;
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    app.useGlobalFilters(new PrismaExceptionFilter());
    await app.init();
    prisma = moduleFixture.get(PrismaService);

    const loginAdmin = `e2e-admin-${sufixo}`;
    await criarUsuarioSemLogin(loginAdmin, 'ADMIN');
    adminToken = await login(loginAdmin);

    const loginProfessorA = `e2e-profA-${sufixo}@teste.com`;
    const userProfessorAId = await criarUsuarioSemLogin(
      loginProfessorA,
      'PROFESSOR',
    );
    const professorA = await prisma.professor.create({
      data: {
        userId: userProfessorAId,
        nome: 'Professor A',
        email: loginProfessorA,
      },
    });
    professorAToken = await login(loginProfessorA);

    const loginProfessorB = `e2e-profB-${sufixo}@teste.com`;
    const userProfessorBId = await criarUsuarioSemLogin(
      loginProfessorB,
      'PROFESSOR',
    );
    await prisma.professor.create({
      data: {
        userId: userProfessorBId,
        nome: 'Professor B',
        email: loginProfessorB,
      },
    });
    professorBToken = await login(loginProfessorB);

    const loginAluno = `e2e-aluno-${sufixo}`;
    const userAlunoId = await criarUsuarioSemLogin(loginAluno, 'ALUNO');
    await prisma.aluno.create({
      data: {
        userId: userAlunoId,
        nome: 'Aluno E2E',
        matricula: `e2e-${sufixo}`,
      },
    });
    alunoToken = await login(loginAluno);

    const semestre = await prisma.semestre.create({
      data: {
        nome: `E2E ${sufixo}`,
        dataInicio: new Date('2026-01-01'),
        dataFim: new Date('2026-06-30'),
      },
    });
    semestreId = semestre.id;

    const turma = await prisma.turma.create({
      data: {
        cursoTecnico: 'Curso E2E',
        anoSerie: '1º ano',
        turno: 'MANHA',
        semestreId,
      },
    });
    turmaId = turma.id;

    const materia = await prisma.materia.create({
      data: {
        nome: 'Matéria do Professor A',
        turmaId,
        professorId: professorA.id,
        cargaHorariaReferencia: 60,
      },
    });
    materiaDoProfessorAId = materia.id;
  });

  afterAll(async () => {
    await prisma.materia.deleteMany({ where: { turmaId } });
    await prisma.turma.delete({ where: { id: turmaId } });
    await prisma.semestre.delete({ where: { id: semestreId } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    await app.close();
  });

  it('professor não acessa endpoint exclusivo de admin (403)', async () => {
    const resposta = await request(app.getHttpServer())
      .get('/professores')
      .set('Authorization', `Bearer ${professorAToken}`);
    expect(resposta.status).toBe(403);
  });

  it('aluno não acessa endpoint exclusivo de admin (403)', async () => {
    const resposta = await request(app.getHttpServer())
      .get('/alunos')
      .set('Authorization', `Bearer ${alunoToken}`);
    expect(resposta.status).toBe(403);
  });

  it('aluno não acessa endpoint exclusivo de professor/admin (403)', async () => {
    const resposta = await request(app.getHttpServer())
      .post(`/materias/${materiaDoProfessorAId}/atividades`)
      .set('Authorization', `Bearer ${alunoToken}`)
      .send({
        titulo: 'x',
        formatoExigido: 'PDF',
        prazo: '2030-01-01T00:00:00.000Z',
      });
    expect(resposta.status).toBe(403);
  });

  it('professor B não vê a matéria do professor A — 404, não 403', async () => {
    const resposta = await request(app.getHttpServer())
      .get(`/materias/${materiaDoProfessorAId}/atividades`)
      .set('Authorization', `Bearer ${professorBToken}`);
    expect(resposta.status).toBe(404);
  });

  it('professor B não consegue criar atividade na matéria do professor A — 404', async () => {
    const resposta = await request(app.getHttpServer())
      .post(`/materias/${materiaDoProfessorAId}/atividades`)
      .set('Authorization', `Bearer ${professorBToken}`)
      .send({
        titulo: 'Atividade indevida',
        formatoExigido: 'PDF',
        prazo: '2030-01-01T00:00:00.000Z',
      });
    expect(resposta.status).toBe(404);
  });

  it('professor A acessa normalmente a própria matéria', async () => {
    const resposta = await request(app.getHttpServer())
      .get(`/materias/${materiaDoProfessorAId}/atividades`)
      .set('Authorization', `Bearer ${professorAToken}`);
    expect(resposta.status).toBe(200);
  });

  it('professor B não vê o relatório de frequência da turma do professor A — 404', async () => {
    const resposta = await request(app.getHttpServer())
      .get(`/relatorios/turma/${turmaId}/frequencia`)
      .set('Authorization', `Bearer ${professorBToken}`);
    expect(resposta.status).toBe(404);
  });

  it('aluno não vinculado não vê o relatório de frequência dessa turma — 404', async () => {
    const resposta = await request(app.getHttpServer())
      .get(`/relatorios/turma/${turmaId}/frequencia`)
      .set('Authorization', `Bearer ${alunoToken}`);
    expect(resposta.status).toBe(404);
  });

  it('admin acessa qualquer matéria, de qualquer professor', async () => {
    const resposta = await request(app.getHttpServer())
      .get(`/materias/${materiaDoProfessorAId}/atividades`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(resposta.status).toBe(200);
  });
});
