import {
  Dialog,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemText,
  Typography,
} from '@mui/material';
import { useMateriaisAulaControllerListar } from '../../../api/generated/materiais-aula/materiais-aula';

interface AulaMateriaisDialogProps {
  aulaId: string | null;
  onClose: () => void;
}

export function AulaMateriaisDialog({ aulaId, onClose }: AulaMateriaisDialogProps) {
  const { data, isLoading } = useMateriaisAulaControllerListar(aulaId ?? '', {
    query: { enabled: !!aulaId },
  });

  return (
    <Dialog open={!!aulaId} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Material da aula</DialogTitle>
      <DialogContent>
        <List>
          {!isLoading &&
            (data ?? []).map((material) => (
              <ListItem key={material.id}>
                <ListItemText
                  primary={
                    <a href={material.arquivoUrl} target="_blank" rel="noreferrer">
                      {material.titulo}
                    </a>
                  }
                  secondary={new Date(material.postadoEm).toLocaleString('pt-BR')}
                />
              </ListItem>
            ))}
          {!isLoading && !data?.length && (
            <Typography color="text.secondary" variant="body2">
              Nenhum material enviado para esta aula.
            </Typography>
          )}
        </List>
      </DialogContent>
    </Dialog>
  );
}
