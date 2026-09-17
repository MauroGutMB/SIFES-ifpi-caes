import { TablePagination } from '@mui/material';
import { TAMANHO_PAGINA_PADRAO } from './usePaginacao';

interface PaginacaoProps {
  total: number;
  pagina: number;
  onChange: (pagina: number) => void;
  tamanhoPagina?: number;
}

/** Rodapé de paginação padrão do sistema — máximo de 30 itens por página, sem opção de
 * aumentar (evita listas "sem fim" dentro de uma única tela). */
export function Paginacao({ total, pagina, onChange, tamanhoPagina = TAMANHO_PAGINA_PADRAO }: PaginacaoProps) {
  if (total <= tamanhoPagina) return null;
  return (
    <TablePagination
      component="div"
      count={total}
      page={pagina}
      onPageChange={(_e, novaPagina) => onChange(novaPagina)}
      rowsPerPage={tamanhoPagina}
      rowsPerPageOptions={[tamanhoPagina]}
      labelRowsPerPage=""
    />
  );
}
