import { AppBar, Box, Button, IconButton, Slide, Toolbar, Typography, useScrollTrigger } from '@mui/material';
import MenuIcon from '@mui/icons-material/MenuOutlined';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { tokens } from '../theme/tokens';
import { SidebarProvider, useSidebar } from './SidebarContext';
import sifesMark from '../assets/sifes-mark.png';

const NOME_PAPEL: Record<string, string> = {
  ADMIN: 'Administrador',
  PROFESSOR: 'Professor',
  ALUNO: 'Aluno',
};

function BotaoMenu() {
  const { toggle } = useSidebar();
  return (
    <IconButton onClick={toggle} aria-label="Alternar painel lateral" sx={{ color: '#fff', mr: 0.5 }}>
      <MenuIcon />
    </IconButton>
  );
}

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const escondeHero = useScrollTrigger();

  const sair = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <SidebarProvider>
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        <Slide appear={false} direction="down" in={!escondeHero}>
        <AppBar position="fixed">
          <Toolbar sx={{ gap: { xs: 0.75, sm: 1.75 } }}>
            <BotaoMenu />
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                bgcolor: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <img src={sifesMark} alt="" width={22} height={22} />
            </Box>
            <Typography
              component="div"
              sx={{ flexGrow: 1, fontFamily: "'Archivo', sans-serif", fontWeight: 800, fontSize: 18 }}
            >
              SIFES
            </Typography>
            {user && (
              <Box
                component="span"
                sx={{
                  display: { xs: 'none', sm: 'inline-flex' },
                  fontFamily: "'Archivo', sans-serif",
                  bgcolor: tokens.yellow,
                  color: tokens.yellowText,
                  fontWeight: 700,
                  fontSize: 11,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  px: 1.25,
                  py: 0.5,
                  borderRadius: 1,
                }}
              >
                {NOME_PAPEL[user.role]}
              </Box>
            )}
            <Button
              variant="outlined"
              onClick={sair}
              sx={{
                height: 34,
                minWidth: { xs: 0, sm: 64 },
                px: { xs: 1, sm: 1.75 },
                color: '#fff',
                borderColor: 'rgba(255,255,255,0.4)',
                '&:hover': { borderColor: '#fff', bgcolor: 'rgba(255,255,255,0.08)' },
              }}
            >
              Sair
            </Button>
          </Toolbar>
          <Box sx={{ position: 'absolute', left: 0, right: 0, bottom: -4, height: 4, bgcolor: tokens.yellow }} />
        </AppBar>
        </Slide>
        <Toolbar />

        <Box component="main" sx={{ p: 2.5 }}>
          <Outlet />
        </Box>
      </Box>
    </SidebarProvider>
  );
}
