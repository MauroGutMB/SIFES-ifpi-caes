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
    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, minHeight: '100vh' }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'row', sm: 'column' },
          alignItems: { xs: 'center', sm: 'stretch' },
          justifyContent: { xs: 'flex-start', sm: 'space-between' },
          gap: { xs: 1.5, sm: 0 },
          width: { xs: '100%', sm: '38%' },
          minWidth: { xs: 0, sm: 380 },
          maxWidth: { xs: '100%', sm: 600 },
          p: { xs: 2.5, sm: 7 },
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
            display: { xs: 'none', sm: 'block' },
            position: 'absolute',
            right: -90,
            bottom: -70,
            width: 460,
            opacity: 0.09,
            pointerEvents: 'none',
          }}
        />
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'row', sm: 'column' },
            alignItems: { xs: 'center', sm: 'flex-start' },
            gap: { xs: 1.5, sm: 0 },
          }}
        >
          <Box
            sx={{
              width: { xs: 52, sm: 112 },
              height: { xs: 52, sm: 112 },
              borderRadius: 1,
              bgcolor: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Box component="img" src={sifesMark} alt="" sx={{ width: { xs: 38, sm: 80 }, height: { xs: 38, sm: 80 } }} />
          </Box>
          <Box>
            <Typography
              sx={{
                fontFamily: "'Archivo', sans-serif",
                fontWeight: 800,
                fontSize: { xs: 30, sm: 68 },
                letterSpacing: '-0.01em',
                lineHeight: 1,
                mt: { xs: 0, sm: 3.5 },
              }}
            >
              SIFES
            </Typography>
            <Box sx={{ display: { xs: 'none', sm: 'block' }, width: 72, height: 5, bgcolor: tokens.yellow, mt: 2.25 }} />
          </Box>
        </Box>
        <Typography
          sx={{
            display: { xs: 'none', sm: 'block' },
            fontSize: 17,
            lineHeight: 1.5,
            mt: 2.5,
            maxWidth: 420,
            color: '#DCE8DF',
          }}
        >
          Sistema do Instituto Federal de Esperantina
        </Typography>
        <Typography
          sx={{
            display: { xs: 'none', sm: 'block' },
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
