import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import type SuperagentResponse from 'superagent/lib/node/response';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { PrismaExceptionFilter } from '../src/common/prisma-exception.filter';

/**
 * Smoke test de geração de relatórios (RelatoriosController) — PDF via pdfkit e Excel via
 * exceljs, gerados a partir de dados reais do banco (não mockados). Não valida o conteúdo
 * célula a célula (isso já é coberto pelos unit tests de report-render.util), só confirma que a
 * rota, pra cada formato, devolve um arquivo de verdade: content-type correto, corpo não vazio
 * e a assinatura binária esperada (PDF começa com "%PDF", XLSX é um ZIP e começa com "PK").
 */
describe('Geração de relatórios — PDF e Excel (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  const sufixo = Date.now();
  const senha = 'e2e-teste-123';

  let adminToken: string;
  let professorToken: string;
  let alunoToken: string;
  const userIds: string[] = [];

  let semestreId: string;
  let turmaId: string;
  let professorId: string;
  let materiaId: string;
  let alunoId: string;

  // Cria só o User (sem logar ainda) — logar antes de vincular Professor/Aluno gravaria
  // professorId/alunoId undefined no JWT pra sempre, já que esse claim vem de user.professor?.id
  // /user.aluno?.id lidos no momento exato do login (ver auth.service.ts).
  async function criarUsuarioSemLogin(login: string, role: 'ADMIN' | 'PROFESSOR' | 'ALUNO') {
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

  function assinaturaBinaria(buffer: Buffer, esperada: string): boolean {
    return buffer.subarray(0, esperada.length).toString('latin1') === esperada;
  }

  // supertest/superagent só bufferiza a resposta como Buffer "de graça" pra content-types que
  // reconhece (ex: application/pdf) — pra outros binários (ex: o mimetype de xlsx) ele tenta
  // decodificar como texto e corrompe os bytes. Esse parser força a leitura crua em todos os
  // formatos, pra comparar a assinatura binária real do arquivo devolvido.
  function binaryParser(
    res: SuperagentResponse,
    callback: (err: Error | null, body: Buffer) => void,
  ) {
    res.setEncoding('binary');
    let data = '';
    res.on('data', (chunk: string) => {
      data += chunk;
    });
    res.on('end', () => {
      callback(null, Buffer.from(data, 'binary'));
    });
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

    const loginAdmin = `e2e-admin-relatorios-${sufixo}`;
    await criarUsuarioSemLogin(loginAdmin, 'ADMIN');
    adminToken = await login(loginAdmin);

    const loginProfessor = `e2e-prof-relatorios-${sufixo}@teste.com`;
    const userProfessorId = await criarUsuarioSemLogin(loginProfessor, 'PROFESSOR');
    const professor = await prisma.professor.create({
      data: {
        userId: userProfessorId,
        nome: 'Professor Relatórios E2E',
        email: loginProfessor,
      },
    });
    professorId = professor.id;
    professorToken = await login(loginProfessor);

    const semestre = await prisma.semestre.create({
      data: {
        nome: `E2E Relatórios ${sufixo}`,
        dataInicio: new Date('2026-01-01'),
        dataFim: new Date('2026-06-30'),
      },
    });
    semestreId = semestre.id;

    const turma = await prisma.turma.create({
      data: {
        cursoTecnico: 'Curso E2E Relatórios',
        anoSerie: '1º ano',
        turno: 'MANHA',
        semestreId,
      },
    });
    turmaId = turma.id;

    const materia = await prisma.materia.create({
      data: {
        nome: 'Matéria Relatórios',
        turmaId,
        professorId,
        cargaHorariaReferencia: 60,
      },
    });
    materiaId = materia.id;

    const loginAluno = `e2e-aluno-relatorios-${sufixo}`;
    const userAlunoId = await criarUsuarioSemLogin(loginAluno, 'ALUNO');
    const aluno = await prisma.aluno.create({
      data: {
        userId: userAlunoId,
        nome: 'Aluno Relatórios E2E',
        matricula: `e2e-relatorios-${sufixo}`,
        turmaId,
      },
    });
    alunoId = aluno.id;
    alunoToken = await login(loginAluno);
    await prisma.vinculoAlunoMateria.create({
      data: { alunoId, materiaId },
    });
  });

  afterAll(async () => {
    await prisma.vinculoAlunoMateria.deleteMany({ where: { materiaId } });
    await prisma.materia.delete({ where: { id: materiaId } });
    await prisma.turma.delete({ where: { id: turmaId } });
    await prisma.semestre.delete({ where: { id: semestreId } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    await app.close();
  });

  describe.each([
    ['pdf', 'application/pdf', '%PDF'],
    ['xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'PK'],
  ])('formato=%s', (formato, contentTypeEsperado, assinaturaEsperada) => {
    it('diário da matéria (professor)', async () => {
      const resposta = await request(app.getHttpServer())
        .get(`/relatorios/diario/${materiaId}?formato=${formato}`)
        .set('Authorization', `Bearer ${professorToken}`)
        .buffer(true)
        .parse(binaryParser);
      expect(resposta.status).toBe(200);
      expect(resposta.headers['content-type']).toContain(contentTypeEsperado);
      const buffer = resposta.body as Buffer;
      expect(buffer.length).toBeGreaterThan(0);
      expect(assinaturaBinaria(buffer, assinaturaEsperada)).toBe(true);
    });

    it('boletim do aluno (o próprio aluno)', async () => {
      const resposta = await request(app.getHttpServer())
        .get(`/relatorios/boletim/${alunoId}?formato=${formato}`)
        .set('Authorization', `Bearer ${alunoToken}`)
        .buffer(true)
        .parse(binaryParser);
      expect(resposta.status).toBe(200);
      expect(resposta.headers['content-type']).toContain(contentTypeEsperado);
      const buffer = resposta.body as Buffer;
      expect(buffer.length).toBeGreaterThan(0);
      expect(assinaturaBinaria(buffer, assinaturaEsperada)).toBe(true);
    });

    it('frequência da matéria (admin)', async () => {
      const resposta = await request(app.getHttpServer())
        .get(`/relatorios/frequencia-materia/${materiaId}?formato=${formato}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .buffer(true)
        .parse(binaryParser);
      expect(resposta.status).toBe(200);
      expect(resposta.headers['content-type']).toContain(contentTypeEsperado);
      const buffer = resposta.body as Buffer;
      expect(buffer.length).toBeGreaterThan(0);
      expect(assinaturaBinaria(buffer, assinaturaEsperada)).toBe(true);
    });

    it('agenda semanal (professor)', async () => {
      const resposta = await request(app.getHttpServer())
        .get(`/relatorios/agenda?formato=${formato}`)
        .set('Authorization', `Bearer ${professorToken}`)
        .buffer(true)
        .parse(binaryParser);
      expect(resposta.status).toBe(200);
      expect(resposta.headers['content-type']).toContain(contentTypeEsperado);
      const buffer = resposta.body as Buffer;
      expect(buffer.length).toBeGreaterThan(0);
      expect(assinaturaBinaria(buffer, assinaturaEsperada)).toBe(true);
    });
  });

  it('formato inválido retorna 400', async () => {
    const resposta = await request(app.getHttpServer())
      .get(`/relatorios/diario/${materiaId}?formato=docx`)
      .set('Authorization', `Bearer ${professorToken}`);
    expect(resposta.status).toBe(400);
  });

  it('aluno não pode gerar o diário da matéria de outra pessoa — 403', async () => {
    const resposta = await request(app.getHttpServer())
      .get(`/relatorios/diario/${materiaId}`)
      .set('Authorization', `Bearer ${alunoToken}`);
    expect(resposta.status).toBe(403);
  });
});
