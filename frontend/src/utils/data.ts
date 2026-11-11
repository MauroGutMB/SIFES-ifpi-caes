/**
 * O backend guarda `Aula.data`, `horaInicio`/`horaFim` e as datas do Semestre como UTC "de
 * mentira": os dígitos UTC já são a data/hora de Brasília (meia-noite UTC = o dia, sem fuso).
 * Formatar com o fuso do navegador (UTC-3) mostraria o dia anterior — por isso estes helpers
 * fixam `timeZone: 'UTC'`. Instantes reais (prazo, enviadoEm, criadaEm) NÃO usam estes helpers:
 * eles seguem o fuso do navegador normalmente.
 */
export function formatarDataCivil(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

export function formatarHoraCivil(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  });
}
