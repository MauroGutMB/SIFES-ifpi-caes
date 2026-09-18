import { StatusFrequencia } from '../../generated/prisma/client';

export const NOTA_CORTE = 7;
export const FREQUENCIA_MINIMA_PERCENTUAL = 75;

export type Situacao = 'CURSANDO' | 'APROVADO' | 'REPROVADO';

export type ModoItemEspecial =
  'PONDERADA' | 'SUBSTITUI_ITEM' | 'SUBSTITUI_MEDIA';

export interface ItemParaNotaFinal {
  id: string;
  valorMaximo: number;
  valorObtido: number;
  peso: number;
  especial: boolean;
  modoEspecial: ModoItemEspecial | null;
  itemSubstituidoId: string | null;
  /** Só é relevante quando `especial` é true — se o aluno não foi habilitado (professor não
   * marcou recuperação/prova final pra ele), o item é ignorado no cálculo dele. */
  habilitadoParaAluno: boolean;
}

/**
 * Média ponderada 0–10 dos itens normais (item sem nota lançada conta como 0), com os itens
 * especiais habilitados pro aluno entrando conforme o `modoEspecial` configurado:
 * - PONDERADA: mais um componente na mesma média ponderada, com seu próprio peso.
 * - SUBSTITUI_ITEM: troca o componente do item indicado (`itemSubstituidoId`) pelo do especial.
 * - SUBSTITUI_MEDIA: a nota final vira diretamente a nota (normalizada) do item especial.
 * Um item especial só entra se atingir a `notaMinimaAprovacao` da disciplina — abaixo disso é
 * ignorado e o cálculo segue como se o aluno não tivesse acesso a ele (não existe um segundo
 * "meta mínima" por item: é a mesma nota mínima configurada pra aprovação na disciplina).
 *
 * `peso` nasce como 1 na criação do item (ver PlanoDisciplinaService.criarItem) — todo item
 * conta igual na média até o professor customizar pesos pela regra de aprovação.
 */
export function calcularNotaFinal(
  itens: ItemParaNotaFinal[],
  notaMinimaAprovacao: number = NOTA_CORTE,
): number {
  const normalizar = (item: ItemParaNotaFinal) =>
    item.valorMaximo === 0 ? 0 : (item.valorObtido / item.valorMaximo) * 10;

  let componentes = itens
    .filter((item) => !item.especial)
    .map((item) => ({ id: item.id, peso: item.peso, nota: normalizar(item) }));

  const especiaisValidos = itens.filter((item) => {
    if (!item.especial || !item.habilitadoParaAluno) return false;
    return normalizar(item) >= notaMinimaAprovacao;
  });

  let substituicaoDeMedia: number | null = null;
  for (const especial of especiaisValidos) {
    const notaEspecial = normalizar(especial);
    if (especial.modoEspecial === 'SUBSTITUI_MEDIA') {
      substituicaoDeMedia = notaEspecial;
    } else if (especial.modoEspecial === 'SUBSTITUI_ITEM') {
      componentes = componentes.filter(
        (c) => c.id !== especial.itemSubstituidoId,
      );
      componentes.push({
        id: especial.id,
        peso: especial.peso,
        nota: notaEspecial,
      });
    } else {
      componentes.push({
        id: especial.id,
        peso: especial.peso,
        nota: notaEspecial,
      });
    }
  }

  if (substituicaoDeMedia !== null) return substituicaoDeMedia;

  const somaPesos = componentes.reduce((acc, c) => acc + c.peso, 0);
  if (somaPesos === 0) return 0;
  const somaPonderada = componentes.reduce(
    (acc, c) => acc + c.peso * c.nota,
    0,
  );
  return somaPonderada / somaPesos;
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

/** Cursando enquanto a Matéria está aberta; Aprovado/Reprovado só é definido no encerramento.
 * `notaMinimaAprovacao` é configurável por disciplina (padrão NOTA_CORTE = 7, ver
 * Materia.notaMinimaAprovacao) — o professor define na regra de aprovação. */
export function calcularSituacao(
  materiaAberta: boolean,
  notaFinal: number,
  frequenciaPercentual: number,
  notaMinimaAprovacao: number = NOTA_CORTE,
): Situacao {
  if (materiaAberta) return 'CURSANDO';
  return notaFinal >= notaMinimaAprovacao &&
    frequenciaPercentual >= FREQUENCIA_MINIMA_PERCENTUAL
    ? 'APROVADO'
    : 'REPROVADO';
}
