import { StatusFrequencia } from '../../generated/prisma/client';

export const NOTA_CORTE = 7;
export const FREQUENCIA_MINIMA_PERCENTUAL = 75;

export type Situacao = 'CURSANDO' | 'APROVADO' | 'REPROVADO';

/** Nota final normalizada 0–10: item sem nota lançada conta como 0 (entra no denominador). */
export function calcularNotaFinal(
  itens: { valorMaximo: number; valorObtido: number }[],
): number {
  const somaMaxima = itens.reduce((acc, item) => acc + item.valorMaximo, 0);
  if (somaMaxima === 0) return 0;
  const somaObtida = itens.reduce((acc, item) => acc + item.valorObtido, 0);
  return (somaObtida / somaMaxima) * 10;
}

/** % de presença sobre as aulas não justificadas (falta justificada não entra no denominador). */
export function calcularFrequenciaPercentual(
  frequencias: { status: StatusFrequencia }[],
): number {
  const consideradas = frequencias.filter(
    (f) => f.status !== StatusFrequencia.FALTA_JUSTIFICADA,
  );
  if (consideradas.length === 0) return 100;
  const presentes = consideradas.filter(
    (f) => f.status === StatusFrequencia.PRESENTE,
  ).length;
  return (presentes / consideradas.length) * 100;
}

/** Cursando enquanto a Matéria está aberta; Aprovado/Reprovado só é definido no encerramento. */
export function calcularSituacao(
  materiaAberta: boolean,
  notaFinal: number,
  frequenciaPercentual: number,
): Situacao {
  if (materiaAberta) return 'CURSANDO';
  return notaFinal >= NOTA_CORTE &&
    frequenciaPercentual >= FREQUENCIA_MINIMA_PERCENTUAL
    ? 'APROVADO'
    : 'REPROVADO';
}
