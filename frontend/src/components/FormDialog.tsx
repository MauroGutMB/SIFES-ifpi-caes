import { useState, type ReactNode } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmberOutlined';
import { tokens } from '../theme/tokens';
import { ConfirmDialog } from './ConfirmDialog';

interface FormDialogProps {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  onSubmit: () => void;
  submitLabel: string;
  submittingLabel?: string;
  submitting?: boolean;
  error?: string | null;
  /** Largura do diálogo — 480px é o padrão da prancha; 520–560px para formulários com
   * sub-campos em linha (ex.: horários de matéria). */
  width?: number;
  /** formState.isDirty do React Hook Form — fechar com dados digitados pede confirmação. */
  isDirty?: boolean;
  children: ReactNode;
}

export function FormDialog({
  open,
  title,
  subtitle,
  onClose,
  onSubmit,
  submitLabel,
  submittingLabel,
  submitting = false,
  error,
  width = 480,
  isDirty = false,
  children,
}: FormDialogProps) {
  const [confirmandoFechar, setConfirmandoFechar] = useState(false);

  const pedirFechar = () => {
    if (isDirty) {
      setConfirmandoFechar(true);
    } else {
      onClose();
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={pedirFechar}
        maxWidth={false}
        slotProps={{
          paper: {
            component: 'form',
            sx: { width, maxWidth: '92vw' },
            onSubmit: (event: React.FormEvent) => {
              event.preventDefault();
              onSubmit();
            },
          },
        }}
      >
        <DialogTitle sx={{ pb: subtitle ? 0.5 : 2 }}>{title}</DialogTitle>
        {subtitle && (
          <Typography variant="body2" sx={{ px: 3, color: tokens.textSecondary, fontSize: 13 }}>
            {subtitle}
          </Typography>
        )}

        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2.5 }}>
          {error && (
            <Box
              role="alert"
              sx={{
                display: 'flex',
                gap: 1.25,
                alignItems: 'flex-start',
                p: '12px 14px',
                bgcolor: tokens.redBg,
                border: `1px solid ${tokens.red}`,
                borderRadius: 1,
              }}
            >
              <WarningAmberIcon sx={{ color: tokens.redText, fontSize: 18, mt: '1px' }} />
              <Typography sx={{ fontSize: 13, color: tokens.redText, lineHeight: 1.5 }}>
                {error}
              </Typography>
            </Box>
          )}
          {children}
        </DialogContent>

        <DialogActions
          sx={{
            justifyContent: 'space-between',
            px: 3,
            py: 2,
            bgcolor: '#FAFBFA',
            borderTop: `1px solid ${tokens.border}`,
          }}
        >
          <Button variant="outlined" onClick={pedirFechar} disabled={submitting}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : undefined}
            sx={{ minWidth: 160 }}
          >
            {submitting ? (submittingLabel ?? `${submitLabel}…`) : submitLabel}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={confirmandoFechar}
        title="Descartar alterações?"
        description="Os dados digitados neste formulário serão perdidos."
        confirmLabel="Descartar"
        confirmColor="error"
        onConfirm={() => {
          setConfirmandoFechar(false);
          onClose();
        }}
        onClose={() => setConfirmandoFechar(false)}
      />
    </>
  );
}
