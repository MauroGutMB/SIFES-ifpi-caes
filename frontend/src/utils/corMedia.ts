import { tokens } from '../theme/tokens';

/** Cor de feedback pra uma média exibida ao professor ou ao aluno — usada em toda tela que
 * mostra a média final de uma disciplina (boletim do professor, situação e boletim do aluno).
 * Azul = ainda falta lançar nota de algum item que conta pro aluno (média não é definitiva).
 * Verde = aprovado (média >= nota mínima da disciplina). Vermelho = abaixo da nota mínima. */
export function corMedia(
  notaFinal: number,
  notaParcial: boolean,
  notaMinimaAprovacao: number,
): string {
  if (notaParcial) return tokens.blueText;
  return notaFinal >= notaMinimaAprovacao ? tokens.green : tokens.redText;
}
