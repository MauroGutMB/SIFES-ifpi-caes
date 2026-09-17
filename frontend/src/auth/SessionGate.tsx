import { Box, CircularProgress } from '@mui/material';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

export function SessionGate() {
  const { status, user } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return (
      <Box
        sx={{
          display: 'flex',
          minHeight: '100vh',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (status === 'unauthenticated' || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const emTrocaSenha = location.pathname === '/trocar-senha';
  if (user.precisaTrocarSenha && !emTrocaSenha) {
    return <Navigate to="/trocar-senha" replace />;
  }
  if (!user.precisaTrocarSenha && emTrocaSenha) {
    return <Navigate to="/app" replace />;
  }

  return <Outlet />;
}
