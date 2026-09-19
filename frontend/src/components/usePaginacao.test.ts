import { act, renderHook } from '@testing-library/react';
import { usePaginacao } from './usePaginacao';

describe('usePaginacao', () => {
  it('divide a lista em páginas do tamanho informado', () => {
    const itens = Array.from({ length: 25 }, (_, i) => i);
    const { result } = renderHook(() => usePaginacao(itens, 10));

    expect(result.current.total).toBe(25);
    expect(result.current.itensDaPagina).toEqual(itens.slice(0, 10));
  });

  it('avança de página e retorna os itens correspondentes', () => {
    const itens = Array.from({ length: 25 }, (_, i) => i);
    const { result } = renderHook(() => usePaginacao(itens, 10));

    act(() => result.current.setPagina(2));

    expect(result.current.pagina).toBe(2);
    expect(result.current.itensDaPagina).toEqual(itens.slice(20, 25));
  });

  it('volta pra página 0 se a lista encolher e a página atual ficar fora do intervalo', () => {
    const itens = Array.from({ length: 25 }, (_, i) => i);
    const { result, rerender } = renderHook(
      ({ lista }: { lista: number[] }) => usePaginacao(lista, 10),
      { initialProps: { lista: itens } },
    );

    act(() => result.current.setPagina(2));
    expect(result.current.pagina).toBe(2);

    // Lista encolhe pra só 1 página possível — a página 2 não existe mais.
    rerender({ lista: itens.slice(0, 5) });

    expect(result.current.pagina).toBe(0);
    expect(result.current.itensDaPagina).toEqual(itens.slice(0, 5));
  });

  it('usa o tamanho de página padrão quando nenhum é informado', () => {
    const itens = Array.from({ length: 5 }, (_, i) => i);
    const { result } = renderHook(() => usePaginacao(itens));

    expect(result.current.tamanhoPagina).toBe(30);
  });
});
