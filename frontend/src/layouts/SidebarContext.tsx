import { createContext, useContext, useState, type ReactNode } from 'react';

interface SidebarContextValue {
  open: boolean;
  toggle: () => void;
  close: () => void;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

function abertoPorPadrao(): boolean {
  // Começa aberto em telas largas e fechado (oculto) em celulares — evita
  // que o painel lateral cubra o conteúdo já no primeiro carregamento.
  return typeof window === 'undefined' || window.matchMedia('(min-width: 600px)').matches;
}

/** Estado do painel lateral (aberto/oculto), compartilhado entre a barra superior
 * (botão de menu) e o SidebarLayout de cada papel. */
export function SidebarProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(abertoPorPadrao);

  return (
    <SidebarContext.Provider
      value={{ open, toggle: () => setOpen((v) => !v), close: () => setOpen(false) }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar(): SidebarContextValue {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error('useSidebar precisa estar dentro de um SidebarProvider');
  return ctx;
}
