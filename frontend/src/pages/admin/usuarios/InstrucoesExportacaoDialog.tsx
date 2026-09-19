import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography } from '@mui/material';

interface InstrucoesExportacaoDialogProps {
  open: boolean;
  onClose: () => void;
}

export function InstrucoesExportacaoDialog({ open, onClose }: InstrucoesExportacaoDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Sobre a exportação de usuários</DialogTitle>
      <DialogContent>
        <Stack spacing={1.5}>
          <Typography variant="body2">
            A exportação gera uma lista com <strong>nome, login, cargo e data de criação</strong>, nos
            formatos PDF ou Excel.
          </Typography>
          <Typography variant="body2">
            Só entram usuários com <strong>"Precisa trocar senha" = Não</strong> — ou seja, contas que
            já definiram sua própria senha e estão de fato ativas no sistema.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Usuários recém-criados ou recém-importados (ainda com a senha inicial) não aparecem na
            exportação até trocarem a senha no primeiro acesso.
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Fechar</Button>
      </DialogActions>
    </Dialog>
  );
}
