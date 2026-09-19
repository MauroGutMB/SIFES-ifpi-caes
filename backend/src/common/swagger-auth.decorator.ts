import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

/** Aplica em toda rota/controller que exige login — que é o padrão de toda a API, já que o
 * JwtAuthGuard é global (ver auth.module.ts) e só rotas com @Public() escapam disso. Sem isso,
 * o Swagger não mostra o cadeado de autenticação nem os erros 401/403 possíveis, dando a
 * entender (errado) que a rota é aberta. */
export function ApiAutenticado() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiUnauthorizedResponse({
      description: 'Token ausente, inválido ou expirado',
    }),
    ApiForbiddenResponse({
      description: 'Autenticado, mas sem papel (role) permitido para esta rota',
    }),
  );
}
