import { AppBar, Box, Button, Toolbar, Typography } from '@mui/material';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import sifesMark from '../assets/sifes-mark.png';

const NOME_PAPEL: Record<string, string> = {
  ADMIN: 'Administrador',
  PROFESSOR: 'Professor',
  ALUNO: 'Aluno',
};

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const sair = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="static">
        <Toolbar sx={{ gap: 1.25 }}>
          <Box
            sx={{
              width: 30,
              height: 30,
              borderRadius: '50%',
              bgcolor: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <img src={sifesMark} alt="" width={20} height={20} />
          </Box>
          <Typography variant="subtitle1" component="div" sx={{ flexGrow: 1, fontWeight: 700 }}>
            SIFES
          </Typography>
          {user && (
            <Typography variant="body2" sx={{ mr: 1 }}>
              {NOME_PAPEL[user.role]}
            </Typography>
          )}
          <Button color="inherit" onClick={sair}>
            Sair
          </Button>
        </Toolbar>
      </AppBar>

      <Box component="main" sx={{ p: 2.5 }}>
        <Outlet />
      </Box>
    </Box>
  );
}
