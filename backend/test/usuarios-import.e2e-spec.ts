import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { PrismaExceptionFilter } from '../src/common/prisma-exception.filter';

/**
 * Importação em lote de usuários via CSV (POST /users/importar) — a rota mais stateful de
 * cadastro do sistema: uma linha malformada não derruba as outras (vai pra `erros`), um login
 * que já existe é pulado sem duplicar nem falhar (`ignorados`, reimportar o mesmo arquivo é
 * seguro), e cada linha válida efetivamente cria um User + Aluno/Professor de verdade com senha
 * inicial gerada. O unit test de UsersService cobre a validação de encoding isoladamente; este
 * teste cobre o caminho inteiro batendo no banco real e confirmando que os registros nascem e
 * que a senha inicial devolvida realmente autentica.
 */
describe('Importação de usuários via CSV (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  const sufixo = Date.now();
  const senha = 'e2e-teste-123';

  let adminToken: string;
  const userIds: string[] = [];

  const loginAlunoNovo = `e2e-import-aluno-${sufixo}`;
  const loginProfessorNovo = `e2e-import-prof-${sufixo}@teste.com`;

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

    const senhaHash = await bcrypt.hash(senha, 10);
    const admin = await prisma.user.create({
      data: {
        login: `e2e-admin-import-${sufixo}`,
        senhaHash,
        role: 'ADMIN',
        precisaTrocarSenha: false,
      },
    });
    userIds.push(admin.id);
    const resposta = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ login: admin.login, senha });
    adminToken = (resposta.body as { accessToken: string }).accessToken;
  });

  afterAll(async () => {
    // Os usuários criados PELA importação não estão em userIds — busca pelos logins conhecidos
    // pra limpar sem depender da ordem de execução dos testes.
    const criadosPelaImportacao = await prisma.user.findMany({
      where: { login: { in: [loginAlunoNovo, loginProfessorNovo] } },
      select: { id: true },
    });
    const todosOsIds = [...userIds, ...criadosPelaImportacao.map((u) => u.id)];
    await prisma.aluno.deleteMany({ where: { userId: { in: todosOsIds } } });
    await prisma.professor.deleteMany({
      where: { userId: { in: todosOsIds } },
    });
    await prisma.user.deleteMany({ where: { id: { in: todosOsIds } } });
    await app.close();
  });

  it('GET /users/modelo-importacao devolve o CSV modelo com cabeçalho correto', async () => {
    const resposta = await request(app.getHttpServer())
      .get('/users/modelo-importacao')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(resposta.status).toBe(200);
    expect(resposta.headers['content-type']).toContain('text/csv');
    const texto = resposta.text.replace(/^\uFEFF/, '');
    expect(texto.split(/\r?\n/)[0].trim()).toBe('nome,login,cargo');
  });

  it('rejeita CSV com cabeçalho errado — 400', async () => {
    const csvInvalido = Buffer.from('a,b,c\nJoão,x,ALUNO\n', 'utf-8');
    const resposta = await request(app.getHttpServer())
      .post('/users/importar')
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('arquivo', csvInvalido, 'usuarios.csv');
    expect(resposta.status).toBe(400);
  });

  it('importa um lote misto: aluno novo + professor novo + linha inválida + login duplicado — cada um cai no balde certo, sem afetar os outros', async () => {
    const csv = Buffer.from(
      'nome,login,cargo\n' +
        `Aluno Importado,${loginAlunoNovo},ALUNO\n` +
        `Professor Importado,${loginProfessorNovo},PROFESSOR\n` +
        ',linha-sem-nome,ALUNO\n' + // erro: nome vazio
        `Aluno Duplicado,${loginAlunoNovo},ALUNO\n`, // ignorado: login já usado na linha 2
      'utf-8',
    );

    const resposta = await request(app.getHttpServer())
      .post('/users/importar')
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('arquivo', csv, 'usuarios.csv');

    expect(resposta.status).toBe(201);
    const corpo = resposta.body as {
      importados: { linha: number; login: string; senhaInicial: string }[];
      erros: { linha: number; motivo: string }[];
      ignorados: { linha: number; login: string }[];
    };

    expect(corpo.importados.map((i) => i.login).sort()).toEqual(
      [loginAlunoNovo, loginProfessorNovo].sort(),
    );
    expect(corpo.importados.every((i) => !!i.senhaInicial)).toBe(true);
    expect(corpo.erros).toHaveLength(1);
    expect(corpo.erros[0].linha).toBe(4);
    expect(corpo.ignorados).toHaveLength(1);
    expect(corpo.ignorados[0].login).toBe(loginAlunoNovo);
  });

  it('efeito colateral: o aluno importado existe de verdade no banco, com precisaTrocarSenha=true', async () => {
    const user = await prisma.user.findUniqueOrThrow({
      where: { login: loginAlunoNovo },
      include: { aluno: true },
    });
    expect(user.role).toBe('ALUNO');
    expect(user.precisaTrocarSenha).toBe(true);
    expect(user.aluno?.matricula).toBe(loginAlunoNovo);
  });

  it('efeito colateral: o professor importado existe de verdade no banco', async () => {
    const user = await prisma.user.findUniqueOrThrow({
      where: { login: loginProfessorNovo },
      include: { professor: true },
    });
    expect(user.role).toBe('PROFESSOR');
    expect(user.professor?.email).toBe(loginProfessorNovo);
  });

  it('a senha inicial gerada pela importação realmente autentica o novo usuário', async () => {
    const listaImportados = await request(app.getHttpServer())
      .post('/users/importar')
      .set('Authorization', `Bearer ${adminToken}`)
      .attach(
        'arquivo',
        Buffer.from(
          `nome,login,cargo\nAluno Login,${loginAlunoNovo}-login,ALUNO\n`,
          'utf-8',
        ),
        'usuarios.csv',
      );
    const senhaInicial = (
      listaImportados.body as { importados: { senhaInicial: string }[] }
    ).importados[0].senhaInicial;

    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ login: `${loginAlunoNovo}-login`, senha: senhaInicial });
    expect(login.status).toBe(200);
    expect((login.body as { accessToken: string }).accessToken).toBeTruthy();

    await prisma.aluno.deleteMany({
      where: { user: { login: `${loginAlunoNovo}-login` } },
    });
    await prisma.user.deleteMany({
      where: { login: `${loginAlunoNovo}-login` },
    });
  });

  it('reimportar o mesmo CSV é seguro — a segunda vez ignora tudo (idempotente)', async () => {
    const csv = Buffer.from(
      `nome,login,cargo\nAluno Importado,${loginAlunoNovo},ALUNO\n`,
      'utf-8',
    );
    const resposta = await request(app.getHttpServer())
      .post('/users/importar')
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('arquivo', csv, 'usuarios.csv');

    expect(resposta.status).toBe(201);
    const corpo = resposta.body as {
      importados: unknown[];
      ignorados: { login: string }[];
    };
    expect(corpo.importados).toHaveLength(0);
    expect(corpo.ignorados.map((i) => i.login)).toContain(loginAlunoNovo);
  });

  it('professor não pode importar usuários — 403', async () => {
    const senhaHash = await bcrypt.hash(senha, 10);
    const userProfessor = await prisma.user.create({
      data: {
        login: `e2e-prof-sem-permissao-${sufixo}@teste.com`,
        senhaHash,
        role: 'PROFESSOR',
        precisaTrocarSenha: false,
      },
    });
    userIds.push(userProfessor.id);
    await prisma.professor.create({
      data: {
        userId: userProfessor.id,
        nome: 'Professor Sem Permissão',
        email: userProfessor.login,
      },
    });
    const loginResposta = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ login: userProfessor.login, senha });
    const professorToken = (loginResposta.body as { accessToken: string })
      .accessToken;

    const resposta = await request(app.getHttpServer())
      .post('/users/importar')
      .set('Authorization', `Bearer ${professorToken}`)
      .attach(
        'arquivo',
        Buffer.from('nome,login,cargo\nX,y,ALUNO\n', 'utf-8'),
        'usuarios.csv',
      );
    expect(resposta.status).toBe(403);
  });
});
