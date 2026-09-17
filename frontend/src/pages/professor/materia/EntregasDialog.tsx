import {
  Dialog,
  DialogContent,
  DialogTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useAtividadesControllerListarEntregas } from '../../../api/generated/atividades/atividades';

interface EntregasDialogProps {
  atividadeId: string | null;
  onClose: () => void;
}

export function EntregasDialog({ atividadeId, onClose }: EntregasDialogProps) {
  const { data, isLoading } = useAtividadesControllerListarEntregas(atividadeId ?? '', {
    query: { enabled: !!atividadeId },
  });

  return (
    <Dialog open={!!atividadeId} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Entregas</DialogTitle>
      <DialogContent>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Aluno</TableCell>
              <TableCell>Enviado em</TableCell>
              <TableCell>Arquivo</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!isLoading &&
              (data ?? []).map((entrega) => (
                <TableRow key={entrega.id}>
                  <TableCell>{entrega.aluno.nome}</TableCell>
                  <TableCell>{new Date(entrega.enviadoEm).toLocaleString('pt-BR')}</TableCell>
                  <TableCell>
                    <a href={entrega.arquivoUrl} target="_blank" rel="noreferrer">
                      Abrir
                    </a>
                  </TableCell>
                </TableRow>
              ))}
            {!isLoading && !data?.length && (
              <TableRow>
                <TableCell colSpan={3}>
                  <Typography color="text.secondary" variant="body2">
                    Nenhuma entrega ainda.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </DialogContent>
    </Dialog>
  );
}
