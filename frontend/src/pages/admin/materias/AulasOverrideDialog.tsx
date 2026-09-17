import {
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
} from '@mui/material';
import { useQueryClient } from '@tanstack/react-query';
import {
  getMateriaAulasControllerFindAllQueryKey,
  useMateriaAulasControllerFindAll,
} from '../../../api/generated/aulas/aulas';
import { useAulasControllerOverride } from '../../../api/generated/aulas/aulas';
import type { AulaDto } from '../../../api/generated/models';

interface AulasOverrideDialogProps {
  materiaId: string | null;
  onClose: () => void;
}

const OPCOES_OVERRIDE = [
  { value: '', label: 'Automático (por frequência lançada)' },
  { value: 'LANCADO', label: 'Forçar lançado' },
  { value: 'NAO_LANCADO', label: 'Forçar não lançado' },
] as const;

export function AulasOverrideDialog({ materiaId, onClose }: AulasOverrideDialogProps) {
  const queryClient = useQueryClient();
  const { data, isLoading } = useMateriaAulasControllerFindAll(materiaId ?? '', {
    query: { enabled: !!materiaId },
  });
  const override = useAulasControllerOverride();

  const aplicarOverride = async (aula: AulaDto, valor: string) => {
    await override.mutateAsync({
      id: aula.id,
      data: { estado: valor === '' ? null : (valor as 'LANCADO' | 'NAO_LANCADO') },
    });
    if (materiaId) {
      await queryClient.invalidateQueries({
        queryKey: getMateriaAulasControllerFindAllQueryKey(materiaId),
      });
    }
  };

  return (
    <Dialog open={!!materiaId} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Aulas e estado de lançamento</DialogTitle>
      <DialogContent>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Data</TableCell>
              <TableCell>Horário</TableCell>
              <TableCell>Estado atual</TableCell>
              <TableCell>Override</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!isLoading &&
              (data ?? []).map((aula) => (
                <TableRow key={aula.id}>
                  <TableCell>{new Date(aula.data).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell>
                    {new Date(aula.horaInicio).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                      timeZone: 'UTC',
                    })}
                    {' – '}
                    {new Date(aula.horaFim).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                      timeZone: 'UTC',
                    })}
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={aula.estado === 'LANCADO' ? 'Lançado' : 'Não lançado'}
                      color={aula.estado === 'LANCADO' ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      select
                      size="small"
                      value={aula.estadoOverride ?? ''}
                      onChange={(e) => aplicarOverride(aula, e.target.value)}
                      sx={{ minWidth: 200 }}
                    >
                      {OPCOES_OVERRIDE.map((opcao) => (
                        <MenuItem key={opcao.value} value={opcao.value}>
                          {opcao.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </DialogContent>
    </Dialog>
  );
}
