import { Test, TestingModule } from '@nestjs/testing';
import { Controller, Get, INestApplication } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Throttle, ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import request from 'supertest';
import { App } from 'supertest/types';

/**
 * Smoke test do mecanismo de rate limiting (ver AppModule/AuthController).
 *
 * Não reusa o AppModule real porque isso puxa o PrismaModule, e inicializar o PrismaClient
 * dentro do Jest está bloqueado nesse projeto (ver o comentário em not-found.e2e-spec.ts —
 * o engine WASM do Prisma 7 exige import() dinâmico que o ambiente CJS do Jest não suporta,
 * e forçar --experimental-vm-modules só troca esse erro por outro no @nestjs/config, que é
 * ESM-only). Corrigir isso de vez exige migrar toda a config de e2e pra ESM nativo — fora do
 * escopo deste smoke test.
 *
 * Em vez disso, este teste reproduz a MESMA configuração usada em produção (bucket 'default'
 * global generoso + @Throttle sobrescrevendo o limite numa rota específica, exatamente como
 * AuthController faz em POST /auth/login) contra um controller mínimo, sem Prisma no caminho.
 * Prova que o ThrottlerGuard + a estratégia de override por rota realmente bloqueiam com 429
 * depois do limite — é a mesma mecânica, só sem o resto da aplicação em volta.
 */
@Controller('throttle-smoke')
class ThrottleSmokeController {
  @Throttle({ default: { limit: 2, ttl: 60_000 } })
  @Get()
  ping() {
    return { ok: true };
  }
}

describe('Rate limiting (smoke)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 100 }]),
      ],
      controllers: [ThrottleSmokeController],
      providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('permite requisições dentro do limite sobrescrito pela rota', async () => {
    await request(app.getHttpServer()).get('/throttle-smoke').expect(200);
    await request(app.getHttpServer()).get('/throttle-smoke').expect(200);
  });

  it('bloqueia com 429 assim que o limite da rota (2/min) é excedido', async () => {
    const resposta = await request(app.getHttpServer()).get('/throttle-smoke');
    expect(resposta.status).toBe(429);
  });
});
