import { useState } from 'react';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';
import CheckIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import ContentCopyIcon from '@mui/icons-material/ContentCopyOutlined';
import WarningAmberIcon from '@mui/icons-material/WarningAmberOutlined';
import { tokens } from '../theme/tokens';

interface SenhaGeradaDialogProps {
  open: boolean;
  nome?: string;
  login: string;
  senha: string;
  onClose: () => void;
}

/** Esta é a única vez que a senha aparece — o diálogo não fecha por Esc/backdrop,
 * só pelo botão "Anotei a senha". */
export function SenhaGeradaDialog({ open, nome, login, senha, onClose }: SenhaGeradaDialogProps) {
  const [copiado, setCopiado] = useState(false);

  const copiar = async () => {
    await navigator.clipboard.writeText(senha);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <Dialog
      open={open}
      onClose={(_event, reason) => {
        if (reason === 'escapeKeyDown' || reason === 'backdropClick') return;
      }}
      maxWidth={false}
      slotProps={{ paper: { sx: { width: 480, maxWidth: '92vw' } } }}
    >
      <DialogTitle sx={{ display: 'flex', gap: 1, alignItems: 'center', pb: 0.5 }}>
        <CheckIcon sx={{ color: tokens.green, fontSize: 22 }} />
        {nome ? `${nome} foi cadastrado(a)` : 'Cadastro criado'}
      </DialogTitle>
      <Typography variant="body2" sx={{ px: 3, color: tokens.textSecondary, fontSize: 13, lineHeight: 1.5 }}>
        Esta é a única vez que a senha aparece. Anote ou copie antes de fechar.
      </Typography>

      <DialogContent sx={{ pt: 2.5 }}>
        <Typography
          sx={{
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: tokens.textSecondary,
            mb: 0.75,
          }}
        >
          Login
        </Typography>
        <Typography sx={{ fontSize: 15, fontWeight: 600, mb: 2.25 }}>{login}</Typography>

        <Typography
          sx={{
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: tokens.textSecondary,
            mb: 0.75,
          }}
        >
          Senha inicial
        </Typography>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            bgcolor: tokens.appBg,
            borderRadius: 1,
            p: '14px 16px',
          }}
        >
          <Box
            component="span"
            sx={{
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: 20,
              fontWeight: 600,
              letterSpacing: '0.04em',
              userSelect: 'all',
            }}
          >
            {senha}
          </Box>
          <Button
            variant="outlined"
            size="small"
            onClick={copiar}
            startIcon={copiado ? <CheckIcon fontSize="small" /> : <ContentCopyIcon fontSize="small" />}
          >
            {copiado ? 'Copiado' : 'Copiar'}
          </Button>
        </Box>

        <Box
          sx={{
            display: 'flex',
            gap: 1,
            mt: 2,
            p: '12px 14px',
            bgcolor: tokens.yellowBg,
            borderRadius: 1,
          }}
        >
          <WarningAmberIcon sx={{ color: tokens.yellowText, fontSize: 16, mt: '1px' }} />
          <Typography sx={{ fontSize: 12.5, color: tokens.yellowText, lineHeight: 1.5 }}>
            Depois de fechar, a senha não pode ser recuperada — será preciso gerar uma nova.
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ justifyContent: 'flex-end', px: 3, py: 2, bgcolor: '#FAFBFA', borderTop: `1px solid ${tokens.border}` }}>
        <Button variant="contained" onClick={onClose}>
          Anotei a senha
        </Button>
      </DialogActions>
    </Dialog>
  );
}
