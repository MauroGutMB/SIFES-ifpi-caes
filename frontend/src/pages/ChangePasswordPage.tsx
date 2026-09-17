import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { isAxiosError } from 'axios';
import { Box, Button, Paper, TextField, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { AuthControllerChangePasswordBody } from '../api/generated/zod/auth/auth';
import { authControllerChangePassword } from '../api/generated/auth/auth';
import { useAuth } from '../auth/AuthContext';
import { tokens } from '../theme/tokens';
import sifesMark from '../assets/sifes-mark.png';

const schema = AuthControllerChangePasswordBody.extend({
  confirmarSenha: z.string(),
}).refine((dados) => dados.novaSenha === dados.confirmarSenha, {
  message: 'Precisa ser igual à senha acima',
  path: ['confirmarSenha'],
});

type ChangePasswordForm = z.infer<typeof schema>;

export function ChangePasswordPage() {
  const { user, marcarSenhaTrocada } = useAuth();
  const navigate = useNavigate();
  const [erro, setErro] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordForm>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (dados) => {
    setErro(null);
    try {
      await authControllerChangePassword({ novaSenha: dados.novaSenha });
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
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      <Box
        sx={{
          height: 56,
          flexShrink: 0,
          bgcolor: tokens.greenDeep,
          display: 'flex',
          alignItems: 'center',
          px: 3,
          position: 'relative',
        }}
      >
        <Box
          sx={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            bgcolor: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <img src={sifesMark} alt="" width={19} height={19} />
        </Box>
        <Typography
          sx={{ fontFamily: "'Archivo', sans-serif", color: '#fff', fontWeight: 800, fontSize: 16, ml: 1.25 }}
        >
          SIFES
        </Typography>
        <Box sx={{ position: 'absolute', left: 0, right: 0, bottom: -4, height: 4, bgcolor: tokens.yellow }} />
      </Box>

      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
        <Paper sx={{ width: '100%', maxWidth: 480, borderTop: `4px solid ${tokens.green}` }}>
          <Box sx={{ p: '28px 28px 0' }}>
            <Typography variant="h5" sx={{ mb: 0.75 }}>
              Defina uma nova senha
            </Typography>
            <Typography sx={{ fontSize: 13, color: tokens.textSecondary, lineHeight: 1.5 }}>
              {user?.role === 'ALUNO'
                ? 'Este é seu primeiro acesso. Defina uma nova senha para continuar.'
                : 'Por segurança, troque a senha temporária antes de continuar.'}
            </Typography>
          </Box>

          <Box component="form" onSubmit={onSubmit} noValidate sx={{ p: '24px 28px' }}>
            <Box sx={{ mb: 2 }}>
              <TextField
                {...register('novaSenha')}
                label="Nova senha"
                type="password"
                placeholder="Crie uma senha"
                error={!!errors.novaSenha}
                helperText={errors.novaSenha?.message ?? 'Mínimo 8 caracteres, com letras e números'}
                fullWidth
                autoFocus
              />
            </Box>
            <Box sx={{ mb: 0.5 }}>
              <TextField
                {...register('confirmarSenha')}
                label="Confirmar nova senha"
                type="password"
                placeholder="Repita a senha"
                error={!!errors.confirmarSenha}
                helperText={errors.confirmarSenha?.message ?? 'Precisa ser igual à senha acima'}
                fullWidth
              />
            </Box>

            {erro && <Typography sx={{ fontSize: 13, color: tokens.redText, mt: 1 }}>{erro}</Typography>}

            <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }} disabled={isSubmitting}>
              Salvar nova senha
            </Button>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
