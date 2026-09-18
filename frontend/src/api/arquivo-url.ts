const API_BASE_URL = import.meta.env.VITE_API_URL ?? '';

/** Resolve uma URL de arquivo (`/arquivos/:id`, vinda direto da API) contra a origem da API —
 * necessário sempre que a URL é usada crua num `src`/`href` do DOM (`<img>`, `<a>`), já que o
 * navegador resolveria um caminho relativo contra a origem da PÁGINA (o frontend, num domínio
 * diferente do backend em produção), não contra a API. Chamadas via axios (`baixarArquivo`,
 * hooks gerados) já não têm esse problema, pois o axios usa `VITE_API_URL` como baseURL. */
export function urlArquivo(caminho: string | null | undefined): string | undefined {
  if (!caminho) return undefined;
  if (/^https?:\/\//.test(caminho)) return caminho;
  return `${API_BASE_URL}${caminho}`;
}
