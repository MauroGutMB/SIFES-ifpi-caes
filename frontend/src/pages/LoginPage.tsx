import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { isAxiosError } from 'axios';
import { Box, Button, Paper, TextField, Typography } from '@mui/material';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthControllerLoginBody } from '../api/generated/zod/auth/auth';
import { useAuth } from '../auth/AuthContext';
import sifesLogo from '../assets/sifes-logo.png';

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
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 2,
      }}
    >
      <Paper sx={{ p: 4, width: '100%', maxWidth: 380 }} elevation={2}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <img src={sifesLogo} alt="SIFES" width={140} />
        </Box>

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
            size="large"
            sx={{ mt: 3 }}
            disabled={isSubmitting}
          >
            Entrar
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
