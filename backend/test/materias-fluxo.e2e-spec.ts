import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { PrismaExceptionFilter } from '../src/common/prisma-exception.filter';

/**
 * Fluxo de encerramento/reabertura de Matéria — o trecho mais arriscado do sistema, porque
 * mexe em cascata: encerrar muda o estado da disciplina, dispara o desligamento automático de
 * quem passou em tudo (ver MateriasService.verificarDesligamentoAutomatico) e faz nascer
 * pendência acadêmica pra quem reprovou (PendenciasService.calcularTodas, calculada ao vivo a
 * partir de disciplinas ENCERRADAS + boletim REPROVADO). Reabrir desfaz o estado da disciplina
 * e, por consequência, some com a pendência calculada (a disciplina volta a "cursando").
 */
describe('Encerramento e reabertura de Matéria (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  const sufixo = Date.now();
  const senha = 'e2e-teste-123';

  let adminToken: string;
  let professorToken: string;

  const userIds: string[] = [];
  let semestreId: string;
  let turmaId: string;
  let professorId: string;
  let materiaId: string;
  let alunoReprovadoId: string;
  let alunoAprovadoId: string;

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

    const loginAdmin = `e2e-admin-materias-${sufixo}`;
    await criarUsuarioSemLogin(loginAdmin, 'ADMIN');
    adminToken = await login(loginAdmin);

    const loginProfessor = `e2e-prof-materias-${sufixo}@teste.com`;
    const userProfessorId = await criarUsuarioSemLogin(loginProfessor, 'PROFESSOR');
    const professor = await prisma.professor.create({
      data: {
        userId: userProfessorId,
        nome: 'Professor Encerramento E2E',
        email: loginProfessor,
      },
    });
    professorId = professor.id;
    professorToken = await login(loginProfessor);

    // Semestre já encerrado — admin pode encerrar a qualquer momento, mas isso também deixa
    // pronta a verificação de que o professor só encerra depois do fim do semestre.
    const semestre = await prisma.semestre.create({
      data: {
        nome: `E2E Encerramento ${sufixo}`,
        dataInicio: new Date('2020-01-01'),
        dataFim: new Date('2020-06-30'),
      },
    });
    semestreId = semestre.id;

    const turma = await prisma.turma.create({
      data: {
        cursoTecnico: 'Curso E2E Encerramento',
        anoSerie: '1º ano',
        turno: 'MANHA',
        semestreId,
      },
    });
    turmaId = turma.id;

    const materia = await prisma.materia.create({
      data: {
        nome: 'Matéria a encerrar',
        turmaId,
        professorId,
        cargaHorariaReferencia: 60,
        notaMinimaAprovacao: 7,
      },
    });
    materiaId = materia.id;

    // Aluno reprovado: fica vinculado à Matéria, mas nunca recebe nota lançada — sem nota,
    // a nota final calculada é 0 (ver boletim.util.calcularNotaFinal, somaPesos === 0 -> 0),
    // que fica abaixo da nota mínima assim que a Matéria fechar. Vinculado à MESMA turma, pra
    // exercitar também a regra de que reprovar em qualquer Matéria da turma trava o desligamento.
    const userAlunoReprovadoId = await criarUsuarioSemLogin(
      `e2e-aluno-reprovado-${sufixo}`,
      'ALUNO',
    );
    const alunoReprovado = await prisma.aluno.create({
      data: {
        userId: userAlunoReprovadoId,
        nome: 'Aluno Reprovado E2E',
        matricula: `e2e-reprovado-${sufixo}`,
        turmaId,
      },
    });
    alunoReprovadoId = alunoReprovado.id;
    await prisma.vinculoAlunoMateria.create({
      data: { alunoId: alunoReprovadoId, materiaId },
    });

    // Aluno aprovado: recebe um item de avaliação com nota acima da mínima, então deve ser
    // desligado automaticamente (turmaId -> null) assim que a única Matéria da turma fechar.
    const userAlunoAprovadoId = await criarUsuarioSemLogin(
      `e2e-aluno-aprovado-${sufixo}`,
      'ALUNO',
    );
    const alunoAprovado = await prisma.aluno.create({
      data: {
        userId: userAlunoAprovadoId,
        nome: 'Aluno Aprovado E2E',
        matricula: `e2e-aprovado-${sufixo}`,
        turmaId,
      },
    });
    alunoAprovadoId = alunoAprovado.id;
    await prisma.vinculoAlunoMateria.create({
      data: { alunoId: alunoAprovadoId, materiaId },
    });

    const item = await prisma.itemAvaliacao.create({
      data: {
        materiaId,
        nome: 'Prova única',
        valorMaximo: 10,
        peso: 1,
      },
    });
    await prisma.nota.create({
      data: { itemAvaliacaoId: item.id, alunoId: alunoAprovadoId, valorObtido: 9 },
    });
  });

  afterAll(async () => {
    await prisma.pendenciaResolvida.deleteMany({ where: { materiaId } });
    await prisma.nota.deleteMany({
      where: { itemAvaliacao: { materiaId } },
    });
    await prisma.itemAvaliacao.deleteMany({ where: { materiaId } });
    await prisma.vinculoAlunoMateria.deleteMany({ where: { materiaId } });
    await prisma.materia.delete({ where: { id: materiaId } });
    await prisma.turma.delete({ where: { id: turmaId } });
    await prisma.semestre.delete({ where: { id: semestreId } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    await app.close();
  });

  it('GET /admin/pendencias não lista nada da matéria enquanto ela está aberta', async () => {
    const resposta = await request(app.getHttpServer())
      .get('/admin/pendencias')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(resposta.status).toBe(200);
    const idsListados = (resposta.body as { id: string }[]).map((p) => p.id);
    expect(idsListados).not.toContain(alunoReprovadoId);
  });

  it('professor encerra a própria matéria (semestre já terminou) — 201/200', async () => {
    const resposta = await request(app.getHttpServer())
      .post(`/materias/${materiaId}/encerrar`)
      .set('Authorization', `Bearer ${professorToken}`);
    expect([200, 201]).toContain(resposta.status);
    expect((resposta.body as { estado: string }).estado).toBe('ENCERRADA');
  });

  it('encerrar de novo falha com 400 — já está encerrada', async () => {
    const resposta = await request(app.getHttpServer())
      .post(`/materias/${materiaId}/encerrar`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(resposta.status).toBe(400);
  });

  it('efeito colateral: aluno aprovado em tudo é desligado automaticamente da turma (turmaId vira null)', async () => {
    const alunoAtualizado = await prisma.aluno.findUniqueOrThrow({
      where: { id: alunoAprovadoId },
    });
    expect(alunoAtualizado.turmaId).toBeNull();
  });

  it('efeito colateral: aluno reprovado continua vinculado à turma (sem desligamento)', async () => {
    const alunoAtualizado = await prisma.aluno.findUniqueOrThrow({
      where: { id: alunoReprovadoId },
    });
    expect(alunoAtualizado.turmaId).toBe(turmaId);
  });

  it('efeito colateral: pendência do aluno reprovado aparece em GET /admin/pendencias', async () => {
    const resposta = await request(app.getHttpServer())
      .get('/admin/pendencias')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(resposta.status).toBe(200);
    const idsListados = (resposta.body as { id: string }[]).map((p) => p.id);
    expect(idsListados).toContain(alunoReprovadoId);
  });

  it('GET /admin/pendencias/:alunoId detalha a matéria reprovada', async () => {
    const resposta = await request(app.getHttpServer())
      .get(`/admin/pendencias/${alunoReprovadoId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(resposta.status).toBe(200);
    const materias = (resposta.body as { materiaId: string }[]).map(
      (p) => p.materiaId,
    );
    expect(materias).toContain(materiaId);
  });

  it('aluno aprovado não aparece em nenhuma pendência', async () => {
    const resposta = await request(app.getHttpServer())
      .get(`/admin/pendencias/${alunoAprovadoId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual([]);
  });

  it('admin resolve a pendência do aluno reprovado, e ela some da lista de pendentes e passa a aparecer nas resolvidas', async () => {
    const resolucao = await request(app.getHttpServer())
      .put(`/admin/pendencias/${alunoReprovadoId}/${materiaId}/resolver`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(resolucao.status).toBe(200);

    const pendentes = await request(app.getHttpServer())
      .get('/admin/pendencias?status=PENDENTE')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(
      (pendentes.body as { id: string }[]).map((p) => p.id),
    ).not.toContain(alunoReprovadoId);

    const resolvidas = await request(app.getHttpServer())
      .get('/admin/pendencias?status=RESOLVIDA')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(
      (resolvidas.body as { id: string }[]).map((p) => p.id),
    ).toContain(alunoReprovadoId);
  });

  it('admin reabre a matéria', async () => {
    const resposta = await request(app.getHttpServer())
      .post(`/materias/${materiaId}/reabrir`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect([200, 201]).toContain(resposta.status);
    expect((resposta.body as { estado: string }).estado).toBe('ABERTA');
  });

  it('efeito colateral da reabertura: a pendência recalculada some (matéria voltou a "cursando")', async () => {
    const resposta = await request(app.getHttpServer())
      .get(`/admin/pendencias/${alunoReprovadoId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual([]);
  });

  it('reabrir uma matéria que já está aberta simplesmente mantém o estado (idempotente)', async () => {
    const resposta = await request(app.getHttpServer())
      .post(`/materias/${materiaId}/reabrir`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect([200, 201]).toContain(resposta.status);
    expect((resposta.body as { estado: string }).estado).toBe('ABERTA');
  });

  it('encerrar com id inexistente retorna 404', async () => {
    const resposta = await request(app.getHttpServer())
      .post('/materias/00000000-0000-0000-0000-000000000000/encerrar')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(resposta.status).toBe(404);
  });
});
