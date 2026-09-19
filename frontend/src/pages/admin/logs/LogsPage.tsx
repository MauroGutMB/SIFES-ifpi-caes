import { useState } from 'react';
import {
  Box,
  Button,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { useQueryClient } from '@tanstack/react-query';
import {
  getLogsControllerListarQueryKey,
  useLogsControllerApagarDoSemestre,
  useLogsControllerListar,
} from '../../../api/generated/logs/logs';
import { useSemestresControllerFindAll } from '../../../api/generated/semestres/semestres';
import type { LogAuditoriaDto } from '../../../api/generated/models';
import { ConfirmDialog } from '../../../components/ConfirmDialog';
import { useToast } from '../../../components/ToastProvider';

export function LogsPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [semestreId, setSemestreId] = useState('');
  const { data: semestres } = useSemestresControllerFindAll();
  const { data, isLoading } = useLogsControllerListar(
    semestreId ? { semestreId } : undefined,
  );
  const apagar = useLogsControllerApagarDoSemestre();
  const [confirmarAberto, setConfirmarAberto] = useState(false);

  const semestreSelecionado = semestres?.find((s) => s.id === semestreId);

  const apagarLogsDoSemestre = async () => {
    if (!semestreId) return;
    try {
      const resultado = await apagar.mutateAsync({ semestreId });
      await queryClient.invalidateQueries({ queryKey: getLogsControllerListarQueryKey() });
      toast.success(`${resultado.removidos} log(s) removido(s)`);
    } catch {
      toast.error('Não foi possível apagar os logs deste semestre');
    } finally {
      setConfirmarAberto(false);
    }
  };

  const columns: GridColDef<LogAuditoriaDto>[] = [
    { field: 'acao', headerName: 'Ação', flex: 1 },
    { field: 'alvo', headerName: 'Alvo', flex: 1.4 },
    { field: 'usuarioNome', headerName: 'Usuário', flex: 1 },
    {
      field: 'criadoEm',
      headerName: 'Data e hora',
      flex: 1,
      valueFormatter: (value: string) => new Date(value).toLocaleString('pt-BR'),
    },
  ];

  return (
    <>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">Logs</Typography>
        <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            select
            size="small"
            label="Semestre"
            value={semestreId}
            onChange={(e) => setSemestreId(e.target.value)}
            sx={{ minWidth: 200 }}
          >
            <MenuItem value="">Todos</MenuItem>
            {(semestres ?? []).map((s) => (
              <MenuItem key={s.id} value={s.id}>
                {s.nome}
              </MenuItem>
            ))}
          </TextField>
          <Button
            color="error"
            variant="outlined"
            disabled={!semestreId}
            onClick={() => setConfirmarAberto(true)}
          >
            Apagar logs deste semestre
          </Button>
        </Stack>
      </Box>

      <Paper variant="outlined">
        <DataGrid
          rows={data ?? []}
          columns={columns}
          loading={isLoading}
          disableRowSelectionOnClick
          density="compact"
          autoHeight
          initialState={{
            sorting: { sortModel: [{ field: 'criadoEm', sort: 'desc' }] },
            pagination: { paginationModel: { pageSize: 30 } },
          }}
        />
      </Paper>

      <ConfirmDialog
        open={confirmarAberto}
        title="Apagar logs do semestre?"
        description={`Isso remove permanentemente todos os logs de "${semestreSelecionado?.nome ?? ''}". Essa ação não pode ser desfeita.`}
        confirmLabel="Apagar logs"
        confirmColor="error"
        confirmValue={semestreSelecionado?.nome}
        loading={apagar.isPending}
        onConfirm={apagarLogsDoSemestre}
        onClose={() => setConfirmarAberto(false)}
      />
    </>
  );
}
