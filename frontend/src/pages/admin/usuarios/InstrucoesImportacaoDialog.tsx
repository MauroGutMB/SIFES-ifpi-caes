import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography } from '@mui/material';

interface InstrucoesImportacaoDialogProps {
  open: boolean;
  onClose: () => void;
}

export function InstrucoesImportacaoDialog({ open, onClose }: InstrucoesImportacaoDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Como importar usuários</DialogTitle>
      <DialogContent>
        <Stack spacing={1.5}>
          <Typography variant="body2">
            1. Clique em <strong>Baixar modelo de importação</strong> para obter um CSV com o cabeçalho
            correto.
          </Typography>
          <Typography variant="body2">
            2. Preencha uma linha por usuário, com as colunas <strong>nome, login, cargo</strong>.
          </Typography>
          <Typography variant="body2">
            • <strong>cargo</strong> deve ser <code>ALUNO</code> ou <code>PROFESSOR</code>.
          </Typography>
          <Typography variant="body2">
            • Para alunos, <strong>login</strong> é a matrícula. Para professores, é o e-mail.
          </Typography>
          <Typography variant="body2">
            3. Salve o arquivo como CSV e envie em <strong>Importar usuários</strong>.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Cada usuário é criado com uma senha inicial gerada automaticamente e marcado para trocá-la
            no primeiro acesso.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Uma linha com coluna faltando ou inválida é ignorada e aparece no relatório de erros — o
            restante do arquivo continua sendo importado normalmente.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Se o login já existir, a linha é apenas pulada (nada é duplicado ou sobrescrito) — reenviar
            o mesmo arquivo mais de uma vez é seguro.
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Fechar</Button>
      </DialogActions>
    </Dialog>
  );
}
