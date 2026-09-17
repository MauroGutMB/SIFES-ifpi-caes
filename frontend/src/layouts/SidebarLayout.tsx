import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Box } from '@mui/material';
import { Outlet } from 'react-router-dom';

const MIN_WIDTH = 180;
const MAX_WIDTH = 360;
const DEFAULT_WIDTH = 220;

interface SidebarLayoutProps {
  storageKey: string;
  nav: ReactNode;
}

function larguraSalva(storageKey: string): number {
  const valor = Number(localStorage.getItem(storageKey));
  return valor >= MIN_WIDTH && valor <= MAX_WIDTH ? valor : DEFAULT_WIDTH;
}

/** Painel lateral genérico com largura arrastável (persistida por papel) — usado por
 * Admin/Professor/Aluno, cada um passando seu próprio conteúdo de navegação em `nav`. */
export function SidebarLayout({ storageKey, nav }: SidebarLayoutProps) {
  const [largura, setLargura] = useState(() => larguraSalva(storageKey));
  const arrastando = useRef(false);

  const iniciarArraste = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    arrastando.current = true;
  }, []);

  useEffect(() => {
    const mover = (event: MouseEvent) => {
      if (!arrastando.current) return;
      const nova = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, event.clientX));
      setLargura(nova);
    };
    const soltar = () => {
      if (!arrastando.current) return;
      arrastando.current = false;
      localStorage.setItem(storageKey, String(largura));
    };
    window.addEventListener('mousemove', mover);
    window.addEventListener('mouseup', soltar);
    return () => {
      window.removeEventListener('mousemove', mover);
      window.removeEventListener('mouseup', soltar);
    };
  }, [largura, storageKey]);

  return (
    <Box sx={{ display: 'flex', mx: -3, my: -3, minHeight: 'calc(100vh - 48px)' }}>
      <Box
        component="nav"
        sx={{
          width: largura,
          flexShrink: 0,
          borderRight: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
          overflowY: 'auto',
        }}
      >
        {nav}
      </Box>

      <Box
        onMouseDown={iniciarArraste}
        sx={{
          width: '5px',
          cursor: 'col-resize',
          flexShrink: 0,
          '&:hover': { bgcolor: 'primary.main', opacity: 0.4 },
        }}
      />

      <Box sx={{ flexGrow: 1, minWidth: 0, p: 2.5 }}>
        <Outlet />
      </Box>
    </Box>
  );
}
