import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography } from '@mui/material';

interface SenhaGeradaDialogProps {
  open: boolean;
  login: string;
  senha: string;
  onClose: () => void;
}

export function SenhaGeradaDialog({ open, login, senha, onClose }: SenhaGeradaDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Cadastro criado</DialogTitle>
      <DialogContent>
        <Alert severity="warning" sx={{ mb: 2 }}>
          Esta senha só é exibida agora — anote antes de fechar.
        </Alert>
        <Stack spacing={1}>
          <Typography variant="body2">
            <strong>Login:</strong> {login}
          </Typography>
          <Typography variant="body2">
            <strong>Senha inicial:</strong> {senha}
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained">
          Ok, anotei
        </Button>
      </DialogActions>
    </Dialog>
  );
}
