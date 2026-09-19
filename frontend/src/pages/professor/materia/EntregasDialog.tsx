import {
  Button,
  Dialog,
  DialogActions,
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
import { baixarArquivo } from '../../../api/download';
import { usePaginacao } from '../../../components/usePaginacao';
import { Paginacao } from '../../../components/Paginacao';

interface EntregasDialogProps {
  atividadeId: string | null;
  onClose: () => void;
}

export function EntregasDialog({ atividadeId, onClose }: EntregasDialogProps) {
  const { data, isLoading } = useAtividadesControllerListarEntregas(atividadeId ?? '', {
    query: { enabled: !!atividadeId },
  });
  const entregas = data ?? [];
  const { pagina, setPagina, itensDaPagina } = usePaginacao(entregas);

  return (
    <Dialog open={!!atividadeId} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Entregas</DialogTitle>
      <DialogContent sx={{ overflowX: 'auto' }}>
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
              itensDaPagina.map((entrega) => (
                <TableRow key={entrega.id}>
                  <TableCell>{entrega.aluno.nome}</TableCell>
                  <TableCell>{new Date(entrega.enviadoEm).toLocaleString('pt-BR')}</TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      onClick={() =>
                        void baixarArquivo(entrega.arquivoUrl, `entrega-${entrega.aluno.nome}`)
                      }
                    >
                      Baixar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            {!isLoading && entregas.length === 0 && (
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
        <Paginacao total={entregas.length} pagina={pagina} onChange={setPagina} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Fechar</Button>
      </DialogActions>
    </Dialog>
  );
}
