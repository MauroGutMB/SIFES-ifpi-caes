import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Box, Drawer, useMediaQuery, useTheme } from '@mui/material';
import { Outlet, useLocation } from 'react-router-dom';
import { useSidebar } from './SidebarContext';

const MIN_WIDTH = 180;
const MAX_WIDTH = 360;
const DEFAULT_WIDTH = 220;
const MOBILE_DRAWER_WIDTH = 272;

interface SidebarLayoutProps {
  storageKey: string;
  nav: ReactNode;
}

function larguraSalva(storageKey: string): number {
  const valor = Number(localStorage.getItem(storageKey));
  return valor >= MIN_WIDTH && valor <= MAX_WIDTH ? valor : DEFAULT_WIDTH;
}

/** Painel lateral genérico — arrastável e ocultável no desktop, sobreposto (drawer)
 * em telas de celular. Admin/Professor/Aluno passam seu próprio conteúdo em `nav`. */
export function SidebarLayout({ storageKey, nav }: SidebarLayoutProps) {
  const [largura, setLargura] = useState(() => larguraSalva(storageKey));
  const [arrastando, setArrastando] = useState(false);
  const arrastandoRef = useRef(false);
  const { open, close } = useSidebar();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const location = useLocation();

  // Em celular o painel é uma sobreposição — fecha sozinho ao navegar, pra não
  // ficar cobrindo a tela seguinte.
  useEffect(() => {
    if (isMobile) close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, isMobile]);

  const iniciarArraste = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    arrastandoRef.current = true;
    setArrastando(true);
  }, []);

  useEffect(() => {
    const mover = (event: MouseEvent) => {
      if (!arrastandoRef.current) return;
      const nova = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, event.clientX));
      setLargura(nova);
    };
    const soltar = () => {
      if (!arrastandoRef.current) return;
      arrastandoRef.current = false;
      setArrastando(false);
      localStorage.setItem(storageKey, String(largura));
    };
    window.addEventListener('mousemove', mover);
    window.addEventListener('mouseup', soltar);
    return () => {
      window.removeEventListener('mousemove', mover);
      window.removeEventListener('mouseup', soltar);
    };
  }, [largura, storageKey]);

  if (isMobile) {
    return (
      <>
        <Drawer
          variant="temporary"
          open={open}
          onClose={close}
          ModalProps={{ keepMounted: true }}
          slotProps={{ paper: { sx: { width: MOBILE_DRAWER_WIDTH } } }}
        >
          {nav}
        </Drawer>
        <Box sx={{ mx: -2.5, my: -2.5, p: 2.5, minHeight: 'calc(100vh - 56px)' }}>
          <Outlet />
        </Box>
      </>
    );
  }

  return (
    <Box sx={{ display: 'flex', mx: -3, my: -3, minHeight: 'calc(100vh - 56px)' }}>
      <Box
        component="nav"
        sx={{
          width: open ? largura : 0,
          flexShrink: 0,
          borderRight: open ? 1 : 0,
          borderColor: 'divider',
          bgcolor: 'background.paper',
          overflow: 'hidden',
          transition: arrastando ? 'none' : 'width .18s ease, border-color .18s ease',
        }}
      >
        <Box sx={{ width: largura, height: '100%', overflowY: 'auto' }}>{nav}</Box>
      </Box>

      {open && (
        <Box
          onMouseDown={iniciarArraste}
          sx={{
            width: '5px',
            cursor: 'col-resize',
            flexShrink: 0,
            transition: 'background-color .15s ease',
            '&:hover': { bgcolor: 'primary.main', opacity: 0.4 },
          }}
        />
      )}

      <Box sx={{ flexGrow: 1, minWidth: 0, p: 2.5 }}>
        <Outlet />
      </Box>
    </Box>
  );
}
