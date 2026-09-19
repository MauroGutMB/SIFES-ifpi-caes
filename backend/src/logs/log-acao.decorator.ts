import { SetMetadata } from '@nestjs/common';

export const LOG_ACAO_KEY = 'logAcao';

export interface ContextoLogAcao {
  params: Record<string, string>;
  body: unknown;
  resultado: unknown;
}

export type ResolvedorLogAcao = (contexto: ContextoLogAcao) => {
  acao: string;
  alvo: string;
};

/** Marca um endpoint como gerador de log de auditoria — só ações de alteração/exclusão
 * (nunca criação simples). `resolvedor` recebe params/body da requisição e o resultado do
 * handler, e devolve o texto da ação e o alvo (o que foi afetado) que vão pro log. */
export const LogAcao = (resolvedor: ResolvedorLogAcao) =>
  SetMetadata(LOG_ACAO_KEY, resolvedor);
