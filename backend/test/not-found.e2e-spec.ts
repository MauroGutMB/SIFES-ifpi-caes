import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { PrismaExceptionFilter } from '../src/common/prisma-exception.filter';

/**
 * Regressão do bug: GET /alunos/:id (e outros findOne baseados em findUniqueOrThrow) com um
 * id inexistente vazava 500 com stack trace do Prisma, em vez de 404. Ver PrismaExceptionFilter.
 *
 * BLOQUEADO no momento: `npm run test:e2e` falha ao inicializar o PrismaClient dentro do Jest —
 * o motor de query do Prisma 7 carrega o compilador WASM via `import()` dinâmico, que o
 * ambiente CJS padrão do Jest não suporta (`--experimental-vm-modules` resolve esse erro
 * específico, mas aí quebra em outro lugar porque o `@nestjs/config` é ESM-only e o modo ESM
 * do Jest/ts-jest não faz o interop CJS/ESM automaticamente). Resolver isso de vez exige migrar
 * a config de e2e inteira pra ESM nativo (preset `ts-jest/presets/default-esm` + ajustes de
 * `tsconfig`/`package.json`) — escopo maior, fica pendente. O teste já está pronto pra rodar
 * assim que isso for destravado.
 */
describe('Not found regression (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let adminToken: string;
  let adminUserId: string;

  const idInexistente = '00000000-0000-0000-0000-000000000000';
  const loginAdminTeste = `e2e-admin-${Date.now()}`;

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
    const senhaHash = await bcrypt.hash('e2e-teste-123', 10);
    const user = await prisma.user.create({
      data: {
        login: loginAdminTeste,
        senhaHash,
        role: 'ADMIN',
        precisaTrocarSenha: false,
      },
    });
    adminUserId = user.id;

    const resposta = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ login: loginAdminTeste, senha: 'e2e-teste-123' });
    adminToken = (resposta.body as { accessToken: string }).accessToken;
  });

  afterAll(async () => {
    await prisma.user.delete({ where: { id: adminUserId } });
    await app.close();
  });

  const casos: { nome: string; rota: string }[] = [
    { nome: 'aluno', rota: `/alunos/${idInexistente}` },
    { nome: 'professor', rota: `/professores/${idInexistente}` },
    { nome: 'turma', rota: `/turmas/${idInexistente}` },
    { nome: 'semestre', rota: `/semestres/${idInexistente}` },
    { nome: 'matéria', rota: `/materias/${idInexistente}` },
  ];

  it.each(casos)(
    'GET $rota (com $nome inexistente) retorna 404, não 500',
    async ({ rota }) => {
      const resposta = await request(app.getHttpServer())
        .get(rota)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(resposta.status).toBe(404);
      expect(resposta.body).not.toHaveProperty('code'); // não vaza o código de erro do Prisma
      expect(resposta.body).not.toHaveProperty('clientVersion'); // nem detalhe interno do driver
    },
  );

  it('rota protegida sem token retorna 401', async () => {
    const resposta = await request(app.getHttpServer()).get('/alunos');
    expect(resposta.status).toBe(401);
  });

  it('login com senha errada retorna 401 e não expõe qual campo errou', async () => {
    const resposta = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ login: loginAdminTeste, senha: 'senha-errada' });
    expect(resposta.status).toBe(401);
    expect((resposta.body as { message: string }).message).toBe(
      'Credenciais inválidas',
    );
  });
});
