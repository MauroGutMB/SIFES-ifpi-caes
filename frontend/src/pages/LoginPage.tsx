import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { isAxiosError } from 'axios';
import { Box, Button, Paper, TextField, Typography } from '@mui/material';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthControllerLoginBody } from '../api/generated/zod/auth/auth';
import { useAuth } from '../auth/AuthContext';
import { tokens } from '../theme/tokens';
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
          justifyContent: 'space-between',
          width: { sm: '38%' },
          minWidth: 380,
          maxWidth: 600,
          p: 7,
          bgcolor: tokens.greenDeep,
          color: '#fff',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box
          component="img"
          src={sifesMark}
          alt=""
          sx={{
            position: 'absolute',
            right: -90,
            bottom: -70,
            width: 460,
            opacity: 0.09,
            pointerEvents: 'none',
          }}
        />
        <Box>
          <Box
            sx={{
              width: 112,
              height: 112,
              borderRadius: 1,
              bgcolor: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <img src={sifesMark} alt="" width={80} height={80} />
          </Box>
          <Typography
            sx={{
              fontFamily: "'Archivo', sans-serif",
              fontWeight: 800,
              fontSize: 68,
              letterSpacing: '-0.01em',
              lineHeight: 1,
              mt: 3.5,
            }}
          >
            SIFES
          </Typography>
          <Box sx={{ width: 72, height: 5, bgcolor: tokens.yellow, mt: 2.25 }} />
          <Typography sx={{ fontSize: 17, lineHeight: 1.5, mt: 2.5, maxWidth: 420, color: '#DCE8DF' }}>
            Sistema do Instituto Federal de Esperantina
          </Typography>
        </Box>
        <Typography
          sx={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: '#A9C4B3',
          }}
        >
          Instituto Federal do Piauí · Campus Esperantina
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
        <Paper sx={{ p: 5, width: '100%', maxWidth: 420, borderTop: `4px solid ${tokens.green}` }}>
          <Typography variant="h5" sx={{ mb: 3.5 }}>
            Entrar
          </Typography>

          <Box component="form" onSubmit={onSubmit} noValidate>
            <Box sx={{ mb: 2 }}>
              <TextField
                {...register('login')}
                label="Login"
                helperText={errors.login?.message}
                error={!!errors.login}
                fullWidth
                autoFocus
              />
            </Box>
            <Box sx={{ mb: 1 }}>
              <TextField
                {...register('senha')}
                label="Senha"
                type="password"
                error={!!errors.senha}
                helperText={errors.senha?.message}
                fullWidth
              />
            </Box>

            {erro && (
              <Typography sx={{ fontSize: 13, color: tokens.redText, mt: 1 }}>{erro}</Typography>
            )}

            <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }} disabled={isSubmitting}>
              Entrar
            </Button>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
