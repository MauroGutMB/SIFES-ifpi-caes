import { useState } from 'react';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography } from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmberOutlined';
import { tokens } from '../theme/tokens';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  confirmColor?: 'primary' | 'error';
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
  /** Quando definido, o botão de confirmar só libera depois de o usuário digitar este
   * valor exatamente igual — usado hoje na exclusão de aluno com histórico. */
  confirmValue?: string;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  confirmColor = 'primary',
  loading = false,
  onConfirm,
  onClose,
  confirmValue,
}: ConfirmDialogProps) {
  const [digitado, setDigitado] = useState('');
  const destrutivo = confirmColor === 'error';
  const bloqueado = confirmValue !== undefined && digitado !== confirmValue;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      slotProps={{
        paper: {
          sx: {
            width: 480,
            maxWidth: '92vw',
            borderTop: destrutivo ? `4px solid ${tokens.red}` : undefined,
          },
        },
        transition: { onExited: () => setDigitado('') },
      }}
    >
      <DialogTitle sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
        {destrutivo && (
          <Box
            sx={{
              width: 36,
              height: 36,
              flexShrink: 0,
              borderRadius: 1,
              bgcolor: tokens.redBg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <WarningAmberIcon sx={{ color: tokens.redText, fontSize: 18 }} />
          </Box>
        )}
        {title}
      </DialogTitle>
      <DialogContent>
        <Typography sx={{ fontSize: 13, color: tokens.textSecondary, lineHeight: 1.5 }}>
          {description}
        </Typography>
        {confirmValue !== undefined && (
          <TextField
            autoFocus
            fullWidth
            label={`Para confirmar, digite ${confirmValue}`}
            placeholder={confirmValue}
            value={digitado}
            onChange={(e) => setDigitado(e.target.value)}
            helperText={`O botão "${confirmLabel}" libera quando o valor bater`}
            sx={{ mt: 2 }}
          />
        )}
      </DialogContent>
      <DialogActions
        sx={{ justifyContent: 'space-between', px: 3, py: 2, bgcolor: '#FAFBFA', borderTop: `1px solid ${tokens.border}` }}
      >
        <Button variant="outlined" onClick={onClose} disabled={loading} autoFocus={confirmValue === undefined}>
          Cancelar
        </Button>
        <Button
          onClick={onConfirm}
          color={confirmColor}
          variant="contained"
          disabled={loading || bloqueado}
        >
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
