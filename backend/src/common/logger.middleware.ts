import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

/**
 * Loga só método, rota, status e tempo de resposta — nunca corpo, headers, cookies ou
 * query string. Não é um filtro que pode deixar passar algo por engano: o dado sensível
 * (senha, token, Authorization) nunca chega perto do log porque simplesmente não é lido.
 */
@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const inicio = Date.now();
    const { method } = req;
    const rota = req.originalUrl.split('?')[0];

    res.on('finish', () => {
      const duracao = Date.now() - inicio;
      const { statusCode } = res;
      const mensagem = `${method} ${rota} ${statusCode} ${duracao}ms`;

      if (statusCode >= 500) {
        this.logger.error(mensagem);
      } else if (statusCode >= 400) {
        this.logger.warn(mensagem);
      } else {
        this.logger.log(mensagem);
      }
    });

    next();
  }
}
