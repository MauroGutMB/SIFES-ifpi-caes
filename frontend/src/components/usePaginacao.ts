import { useMemo, useState } from 'react';

export const TAMANHO_PAGINA_PADRAO = 30;

/** Pagina uma lista já carregada no cliente — usado nas tabelas simples (não-DataGrid)
 * que podem crescer bastante (aulas de um semestre, frequência detalhada etc.). */
export function usePaginacao<T>(itens: T[], tamanhoPagina = TAMANHO_PAGINA_PADRAO) {
  const [pagina, setPagina] = useState(0);

  const itensDaPagina = useMemo(
    () => itens.slice(pagina * tamanhoPagina, pagina * tamanhoPagina + tamanhoPagina),
    [itens, pagina, tamanhoPagina],
  );

  // Se a lista encolher (filtro mudou) e a página atual ficar fora do intervalo, volta pra 0.
  const totalPaginas = Math.max(1, Math.ceil(itens.length / tamanhoPagina));
  if (pagina > 0 && pagina >= totalPaginas) {
    setPagina(0);
  }

  return { pagina, setPagina, itensDaPagina, tamanhoPagina, total: itens.length };
}
