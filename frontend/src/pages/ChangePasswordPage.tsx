import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { isAxiosError } from 'axios';
import { Box, Button, Paper, TextField, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { AuthControllerChangePasswordBody } from '../api/generated/zod/auth/auth';
import { authControllerChangePassword } from '../api/generated/auth/auth';
import { useAuth } from '../auth/AuthContext';

type ChangePasswordForm = z.infer<typeof AuthControllerChangePasswordBody>;

export function ChangePasswordPage() {
  const { user, marcarSenhaTrocada } = useAuth();
  const navigate = useNavigate();
  const [erro, setErro] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordForm>({ resolver: zodResolver(AuthControllerChangePasswordBody) });

  const onSubmit = handleSubmit(async (dados) => {
    setErro(null);
    try {
      await authControllerChangePassword(dados);
      marcarSenhaTrocada();
      navigate('/app', { replace: true });
    } catch (error) {
      const mensagem = isAxiosError(error)
        ? ((error.response?.data as { message?: string } | undefined)?.message ??
          'Não foi possível trocar a senha')
        : 'Não foi possível trocar a senha';
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
        <Typography variant="h6" gutterBottom>
          Troca de senha obrigatória
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {user?.role === 'ALUNO'
            ? 'Este é seu primeiro acesso. Defina uma nova senha para continuar.'
            : 'Sua senha precisa ser trocada antes de continuar.'}
        </Typography>

        <Box component="form" onSubmit={onSubmit} noValidate>
          <TextField
            {...register('novaSenha')}
            label="Nova senha"
            type="password"
            error={!!errors.novaSenha}
            helperText={errors.novaSenha?.message}
            fullWidth
            margin="normal"
            autoFocus
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
            Trocar senha
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
