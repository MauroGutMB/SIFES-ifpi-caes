import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { PrismaExceptionFilter } from './common/prisma-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // contentSecurityPolicy desligado porque quebraria o Swagger UI montado em /docs (ele carrega
  // scripts/estilos inline) — os headers que importam pra prevenir XSS de upload (nosniff,
  // frameguard) continuam ativos por padrão.
  //
  // crossOriginResourcePolicy também precisa sair do padrão ('same-origin'): frontend e backend
  // costumam ficar em domínios diferentes em produção, e GET /arquivos/:id serve fotos de
  // perfil e materiais que o frontend carrega direto num <img>/<a> — com o padrão do helmet,
  // o navegador bloqueia essas respostas por serem "cross-origin", mesmo com a URL certa.
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.use(cookieParser());
  app.useGlobalFilters(new PrismaExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.enableCors({
    origin: process.env.WEB_ORIGIN ?? 'http://localhost:5173',
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('SIFES API')
    .setDescription(
      'API do Sistema do Instituto Federal de Esperantina — Diário de Aula',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
