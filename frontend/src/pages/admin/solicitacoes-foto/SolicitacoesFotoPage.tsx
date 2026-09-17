import { Box, Button, Chip, IconButton, Paper, Stack, Tooltip, Typography } from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import CheckIcon from '@mui/icons-material/CheckOutlined';
import CloseIcon from '@mui/icons-material/CloseOutlined';
import DoneAllIcon from '@mui/icons-material/DoneAllOutlined';
import { useQueryClient } from '@tanstack/react-query';
import {
  getAdminFotoSolicitacoesControllerListarQueryKey,
  useAdminFotoSolicitacoesControllerAprovar,
  useAdminFotoSolicitacoesControllerAprovarTodas,
  useAdminFotoSolicitacoesControllerListar,
  useAdminFotoSolicitacoesControllerRejeitar,
} from '../../../api/generated/admin-foto-solicitacoes/admin-foto-solicitacoes';
import type { SolicitacaoFotoDto } from '../../../api/generated/models';

export function SolicitacoesFotoPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useAdminFotoSolicitacoesControllerListar();
  const aprovar = useAdminFotoSolicitacoesControllerAprovar();
  const rejeitar = useAdminFotoSolicitacoesControllerRejeitar();
  const aprovarTodas = useAdminFotoSolicitacoesControllerAprovarTodas();

  const invalidar = () =>
    queryClient.invalidateQueries({
      queryKey: getAdminFotoSolicitacoesControllerListarQueryKey(),
    });

  const columns: GridColDef<SolicitacaoFotoDto>[] = [
    { field: 'aluno', headerName: 'Aluno', flex: 1, valueGetter: (_v, row) => row.aluno.nome },
    {
      field: 'matricula',
      headerName: 'Matrícula',
      flex: 1,
      valueGetter: (_v, row) => row.aluno.matricula,
    },
    {
      field: 'criadaEm',
      headerName: 'Solicitado em',
      flex: 1,
      valueFormatter: (value: string) => new Date(value).toLocaleString('pt-BR'),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 130,
      renderCell: (params) => (
        <Chip
          size="small"
          label={params.value}
          color={
            params.value === 'PENDENTE'
              ? 'warning'
              : params.value === 'APROVADA'
                ? 'success'
                : 'error'
          }
        />
      ),
    },
    {
      field: 'acoes',
      headerName: '',
      sortable: false,
      filterable: false,
      width: 100,
      renderCell: (params) =>
        params.row.status === 'PENDENTE' && (
          <Stack direction="row">
            <Tooltip title="Aprovar">
              <IconButton
                size="small"
                onClick={async () => {
                  await aprovar.mutateAsync({ id: params.row.id });
                  await invalidar();
                }}
              >
                <CheckIcon fontSize="small" color="success" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Rejeitar">
              <IconButton
                size="small"
                onClick={async () => {
                  await rejeitar.mutateAsync({ id: params.row.id });
                  await invalidar();
                }}
              >
                <CloseIcon fontSize="small" color="error" />
              </IconButton>
            </Tooltip>
          </Stack>
        ),
    },
  ];

  return (
    <>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">Solicitações de foto</Typography>
        <Button
          variant="contained"
          startIcon={<DoneAllIcon />}
          disabled={!data?.length}
          onClick={async () => {
            await aprovarTodas.mutateAsync();
            await invalidar();
          }}
        >
          Aprovar todas
        </Button>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Lista apenas as solicitações pendentes.
      </Typography>

      <Paper variant="outlined">
        <DataGrid
          rows={data ?? []}
          columns={columns}
          loading={isLoading}
          disableRowSelectionOnClick
          density="compact"
          autoHeight
          initialState={{ pagination: { paginationModel: { pageSize: 30 } } }}
        />
      </Paper>
    </>
  );
}
