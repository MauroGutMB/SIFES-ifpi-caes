import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, tap } from 'rxjs';
import { LOG_ACAO_KEY, ResolvedorLogAcao } from './log-acao.decorator';
import { LogsService } from './logs.service';
import type { AuthenticatedUser } from '../auth/auth.types';

/** Interceptor global — só age em endpoints marcados com `@LogAcao(...)`, todos os outros
 * passam direto sem custo. Roda depois que o handler já respondeu com sucesso (erros nunca
 * geram log de "ação feita"), e nunca deixa uma falha ao gravar o log virar erro na resposta
 * real do endpoint. */
@Injectable()
export class LogAuditoriaInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly logs: LogsService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const resolvedor = this.reflector.get<ResolvedorLogAcao | undefined>(
      LOG_ACAO_KEY,
      context.getHandler(),
    );
    if (!resolvedor) return next.handle();

    const request = context.switchToHttp().getRequest<{
      params: Record<string, string>;
      body: unknown;
      user?: AuthenticatedUser;
    }>();

    return next.handle().pipe(
      tap((resultado) => {
        try {
          const { acao, alvo } = resolvedor({
            params: request.params,
            body: request.body,
            resultado,
          });
          void this.logs.registrar(acao, alvo, request.user);
        } catch {
          // Idem: o resolvedor de um endpoint nunca pode quebrar a resposta real dele.
        }
      }),
    );
  }
}
