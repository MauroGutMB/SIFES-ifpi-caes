import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { isAxiosError } from 'axios';
import { Box, Button, Paper, TextField, Typography } from '@mui/material';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthControllerLoginBody } from '../api/generated/zod/auth/auth';
import { useAuth } from '../auth/AuthContext';
import sifesMark from '../assets/sifes-mark.png';

type LoginForm = z.infer<typeof AuthControllerLoginBody>;

export function LoginPage() {
  const { login, status } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [erro, setErro] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(AuthControllerLoginBody) });

  if (status === 'authenticated') {
    const from =
      (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? '/app';
    return <Navigate to={from} replace />;
  }

  const onSubmit = handleSubmit(async (dados) => {
    setErro(null);
    try {
      await login(dados.login, dados.senha);
      navigate('/app', { replace: true });
    } catch (error) {
      const mensagem = isAxiosError(error)
        ? ((error.response?.data as { message?: string } | undefined)?.message ??
          'Não foi possível entrar')
        : 'Não foi possível entrar';
      setErro(mensagem);
    }
  });

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Box
        sx={{
          display: { xs: 'none', sm: 'flex' },
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
          width: { sm: '38%' },
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
        }}
      >
        <Box
          sx={{
            width: 128,
            height: 128,
            borderRadius: '50%',
            bgcolor: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          }}
        >
          <img src={sifesMark} alt="" width={78} height={78} />
        </Box>
        <Typography variant="h4" sx={{ fontWeight: 700, letterSpacing: 1 }}>
          SIFES
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.85, textAlign: 'center', maxWidth: 260 }}>
          Sistema do Instituto Federal de Esperantina
        </Typography>
      </Box>

      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
          p: 2,
        }}
      >
        <Paper variant="outlined" sx={{ p: 4, width: '100%', maxWidth: 360 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Entrar
          </Typography>

          <Box component="form" onSubmit={onSubmit} noValidate>
            <TextField
              {...register('login')}
              label="Login"
              helperText={errors.login?.message ?? 'Matrícula (aluno) ou e-mail (professor/admin)'}
              error={!!errors.login}
              fullWidth
              margin="normal"
              autoFocus
            />
            <TextField
              {...register('senha')}
              label="Senha"
              type="password"
              error={!!errors.senha}
              helperText={errors.senha?.message}
              fullWidth
              margin="normal"
            />

            {erro && (
              <Typography color="error" variant="body2" sx={{ mt: 1 }}>
                {erro}
              </Typography>
            )}

            <Button
              type="submit"
              variant="contained"
              fullWidth
              sx={{ mt: 3, py: 1 }}
              disabled={isSubmitting}
            >
              Entrar
            </Button>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
