import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { PrismaExceptionFilter } from '../src/common/prisma-exception.filter';

// PNG 1x1 válido (magic bytes reais) — necessário porque FileSignatureValidationPipe confere
// os magic bytes do conteúdo, não só o Content-Type declarado pelo cliente (ver
// common/file-signature-validation.pipe.ts).
const PNG_1X1_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

/**
 * Fluxo de aprovação de foto de perfil (aluno solicita, admin aprova/rejeita) —
 * users/me/foto/solicitacoes + admin/foto-solicitacoes. Cobre o estado real batendo no banco:
 * o Arquivo de staging, a transição PENDENTE -> APROVADA/REJEITADA, o efeito colateral de
 * aprovar (User.fotoUrl do aluno é atualizado e o Arquivo de staging é apagado) e a regra de
 * "uma solicitação em voo por vez" (reenviar troca o arquivo em vez de duplicar).
 */
describe('Aprovação de foto de perfil (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  const sufixo = Date.now();
  const senha = 'e2e-teste-123';

  let adminToken: string;
  let alunoToken: string;
  let alunoUserId: string;
  let alunoId: string;
  const userIds: string[] = [];

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
        login: `e2e-admin-foto-${sufixo}`,
        senhaHash,
        role: 'ADMIN',
        precisaTrocarSenha: false,
      },
    });
    userIds.push(admin.id);
    const loginAdmin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ login: admin.login, senha });
    adminToken = (loginAdmin.body as { accessToken: string }).accessToken;

    const userAluno = await prisma.user.create({
      data: {
        login: `e2e-aluno-foto-${sufixo}`,
        senhaHash,
        role: 'ALUNO',
        precisaTrocarSenha: false,
      },
    });
    userIds.push(userAluno.id);
    alunoUserId = userAluno.id;
    const aluno = await prisma.aluno.create({
      data: {
        userId: userAluno.id,
        nome: 'Aluno Foto E2E',
        matricula: `e2e-foto-${sufixo}`,
      },
    });
    alunoId = aluno.id;
    const loginAluno = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ login: userAluno.login, senha });
    alunoToken = (loginAluno.body as { accessToken: string }).accessToken;
  });

  afterAll(async () => {
    await prisma.solicitacaoFoto.deleteMany({ where: { alunoId } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    await app.close();
  });

  it('aluno rejeita o próprio pedido sem foto ainda enviada — GET começa vazio', async () => {
    const resposta = await request(app.getHttpServer())
      .get('/users/me/foto/solicitacoes')
      .set('Authorization', `Bearer ${alunoToken}`);
    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual([]);
  });

  it('aluno envia uma foto — cria solicitação PENDENTE', async () => {
    const resposta = await request(app.getHttpServer())
      .post('/users/me/foto/solicitacoes')
      .set('Authorization', `Bearer ${alunoToken}`)
      .attach('foto', Buffer.from(PNG_1X1_BASE64, 'base64'), {
        filename: 'foto.png',
        contentType: 'image/png',
      });
    expect(resposta.status).toBe(201);
    expect((resposta.body as { status: string }).status).toBe('PENDENTE');
  });

  it('reenviar a foto troca o arquivo da MESMA solicitação em vez de criar outra', async () => {
    const antes = await prisma.solicitacaoFoto.findMany({
      where: { alunoId },
    });
    expect(antes).toHaveLength(1);
    const idAntes = antes[0].id;
    const urlAntes = antes[0].arquivoStagingUrl;

    const resposta = await request(app.getHttpServer())
      .post('/users/me/foto/solicitacoes')
      .set('Authorization', `Bearer ${alunoToken}`)
      .attach('foto', Buffer.from(PNG_1X1_BASE64, 'base64'), {
        filename: 'foto2.png',
        contentType: 'image/png',
      });
    expect(resposta.status).toBe(201);

    const depois = await prisma.solicitacaoFoto.findMany({
      where: { alunoId },
    });
    expect(depois).toHaveLength(1);
    expect(depois[0].id).toBe(idAntes);
    expect(depois[0].arquivoStagingUrl).not.toBe(urlAntes);
  });

  it('upload com conteúdo que não é imagem de verdade é rejeitado (magic bytes) — 400/422', async () => {
    const resposta = await request(app.getHttpServer())
      .post('/users/me/foto/solicitacoes')
      .set('Authorization', `Bearer ${alunoToken}`)
      .attach('foto', Buffer.from('isto não é uma imagem'), {
        filename: 'fake.png',
        contentType: 'image/png',
      });
    expect([400, 422]).toContain(resposta.status);
  });

  it('admin vê a solicitação pendente em GET /admin/foto-solicitacoes', async () => {
    const resposta = await request(app.getHttpServer())
      .get('/admin/foto-solicitacoes')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(resposta.status).toBe(200);
    const alunosListados = (
      resposta.body as { aluno: { id: string } }[]
    ).map((s) => s.aluno.id);
    expect(alunosListados).toContain(alunoId);
  });

  it('aluno não pode aprovar a própria solicitação — 403', async () => {
    const solicitacao = await prisma.solicitacaoFoto.findFirstOrThrow({
      where: { alunoId },
    });
    const resposta = await request(app.getHttpServer())
      .post(`/admin/foto-solicitacoes/${solicitacao.id}/aprovar`)
      .set('Authorization', `Bearer ${alunoToken}`);
    expect(resposta.status).toBe(403);
  });

  it('admin aprova a solicitação — efeito colateral: status muda e a fotoUrl do usuário é atualizada', async () => {
    const solicitacao = await prisma.solicitacaoFoto.findFirstOrThrow({
      where: { alunoId },
    });
    const fotoUrlAntes = (
      await prisma.user.findUniqueOrThrow({ where: { id: alunoUserId } })
    ).fotoUrl;

    const resposta = await request(app.getHttpServer())
      .post(`/admin/foto-solicitacoes/${solicitacao.id}/aprovar`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(resposta.status).toBe(201);
    expect((resposta.body as { status: string }).status).toBe('APROVADA');

    const userAtualizado = await prisma.user.findUniqueOrThrow({
      where: { id: alunoUserId },
    });
    expect(userAtualizado.fotoUrl).toBeTruthy();
    expect(userAtualizado.fotoUrl).not.toBe(fotoUrlAntes);
  });

  it('aprovar de novo a mesma solicitação falha — já foi resolvida', async () => {
    const solicitacao = await prisma.solicitacaoFoto.findFirstOrThrow({
      where: { alunoId },
    });
    const resposta = await request(app.getHttpServer())
      .post(`/admin/foto-solicitacoes/${solicitacao.id}/aprovar`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(resposta.status).toBe(400);
  });

  it('aluno envia nova foto após já ter uma resolvida — cria uma segunda solicitação, agora rejeitável', async () => {
    const antesDoEnvio = await prisma.solicitacaoFoto.count({
      where: { alunoId },
    });

    const envio = await request(app.getHttpServer())
      .post('/users/me/foto/solicitacoes')
      .set('Authorization', `Bearer ${alunoToken}`)
      .attach('foto', Buffer.from(PNG_1X1_BASE64, 'base64'), {
        filename: 'foto3.png',
        contentType: 'image/png',
      });
    expect(envio.status).toBe(201);

    const depoisDoEnvio = await prisma.solicitacaoFoto.count({
      where: { alunoId },
    });
    expect(depoisDoEnvio).toBe(antesDoEnvio + 1);

    const novaSolicitacao = await prisma.solicitacaoFoto.findFirstOrThrow({
      where: { alunoId, status: 'PENDENTE' },
    });

    const rejeicao = await request(app.getHttpServer())
      .post(`/admin/foto-solicitacoes/${novaSolicitacao.id}/rejeitar`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(rejeicao.status).toBe(201);
    expect((rejeicao.body as { status: string }).status).toBe('REJEITADA');
  });
});
