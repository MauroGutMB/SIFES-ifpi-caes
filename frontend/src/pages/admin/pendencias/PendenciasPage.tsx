import { useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  Typography,
} from '@mui/material';
import { DataGrid, type GridColDef, type GridRowSelectionModel } from '@mui/x-data-grid';
import DownloadIcon from '@mui/icons-material/DownloadOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircleOutlined';
import DoneAllIcon from '@mui/icons-material/DoneAllOutlined';
import { useQueryClient } from '@tanstack/react-query';
import {
  getPendenciasControllerListarQueryKey,
  getPendenciasControllerPendenciasDoAlunoQueryKey,
  usePendenciasControllerListar,
  usePendenciasControllerPendenciasDoAluno,
  usePendenciasControllerResolver,
  usePendenciasControllerResolverTodas,
} from '../../../api/generated/pendencias/pendencias';
import type { PendenciaAlunoDto } from '../../../api/generated/models';
import { urlArquivo } from '../../../api/arquivo-url';
import { baixarArquivo } from '../../../api/download';
import { FotoPopup } from '../../../components/FotoPopup';
import { useToast } from '../../../components/ToastProvider';
import { tokens } from '../../../theme/tokens';

interface DetalhesPendenciasDialogProps {
  aluno: PendenciaAlunoDto | null;
  onClose: () => void;
}

function DetalhesPendenciasDialog({ aluno, onClose }: DetalhesPendenciasDialogProps) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { data: itens, isLoading } = usePendenciasControllerPendenciasDoAluno(aluno?.id ?? '', {
    query: { enabled: !!aluno },
  });
  const resolver = usePendenciasControllerResolver();

  const resolverItem = async (materiaId: string) => {
    if (!aluno) return;
    await resolver.mutateAsync({ alunoId: aluno.id, materiaId });
    await queryClient.invalidateQueries({ queryKey: getPendenciasControllerListarQueryKey() });
    await queryClient.invalidateQueries({
      queryKey: getPendenciasControllerPendenciasDoAlunoQueryKey(aluno.id),
    });
    toast.success('Pendência marcada como resolvida');
  };

  return (
    <Dialog open={!!aluno} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Pendências — {aluno?.nome ?? ''}</DialogTitle>
      <DialogContent sx={{ overflowX: 'auto' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Disciplina</TableCell>
              <TableCell>Semestre</TableCell>
              <TableCell>Nota</TableCell>
              <TableCell width={170} />
            </TableRow>
          </TableHead>
          <TableBody>
            {!isLoading &&
              (itens ?? []).map((item) => (
                <TableRow key={item.materiaId}>
                  <TableCell>{item.materiaNome}</TableCell>
                  <TableCell>{item.semestreNome}</TableCell>
                  <TableCell sx={{ color: tokens.redText, fontWeight: 600 }}>
                    {item.notaFinal.toFixed(1)}
                  </TableCell>
                  <TableCell>
                    {item.resolvida ? (
                      <Chip
                        size="small"
                        color="success"
                        variant="outlined"
                        icon={<CheckCircleIcon />}
                        label="Resolvida"
                      />
                    ) : (
                      <Button
                        size="small"
                        variant="outlined"
                        disabled={resolver.isPending}
                        onClick={() => resolverItem(item.materiaId)}
                      >
                        Marcar como resolvida
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            {!isLoading && !itens?.length && (
              <TableRow>
                <TableCell colSpan={4}>
                  <Typography color="text.secondary" variant="body2">
                    Nenhuma pendência encontrada.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Fechar</Button>
      </DialogActions>
    </Dialog>
  );
}

export function PendenciasPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [tab, setTab] = useState(0);
  const status = tab === 0 ? 'PENDENTE' : 'RESOLVIDA';
  const { data, isLoading } = usePendenciasControllerListar({ status });
  const [alunoSelecionado, setAlunoSelecionado] = useState<PendenciaAlunoDto | null>(null);
  const [selecionados, setSelecionados] = useState<GridRowSelectionModel>({
    type: 'include',
    ids: new Set(),
  });
  const [baixando, setBaixando] = useState<string | null>(null);
  const resolverTodas = usePendenciasControllerResolverTodas();

  // A DataGrid alterna para { type: 'exclude', ids } quando "selecionar tudo" é usado
  // (ids vira o conjunto de EXCEÇÕES, não de selecionados) — por isso não dá pra confiar
  // em selecionados.ids.size sozinho, precisa resolver contra as linhas atuais.
  const idsSelecionados =
    selecionados.type === 'include'
      ? [...selecionados.ids].map(String)
      : (data ?? []).map((a) => a.id).filter((id) => !selecionados.ids.has(id));
  const totalSelecionados = idsSelecionados.length;

  const baixarRelatorio = async (formato: 'pdf' | 'xlsx') => {
    setBaixando(formato);
    try {
      await baixarArquivo(`/admin/pendencias/relatorio?formato=${formato}`, `pendencias.${formato}`);
    } finally {
      setBaixando(null);
    }
  };

  const resolverSelecionados = async () => {
    const total = idsSelecionados.length;
    await Promise.allSettled(
      idsSelecionados.map((alunoId) => resolverTodas.mutateAsync({ alunoId })),
    );
    await queryClient.invalidateQueries({ queryKey: getPendenciasControllerListarQueryKey() });
    setSelecionados({ type: 'include', ids: new Set() });
    toast.success(`${total} aluno(s) marcado(s) como resolvido(s)`);
  };

  const columns: GridColDef<PendenciaAlunoDto>[] = [
    {
      field: 'fotoUrl',
      headerName: 'Foto',
      width: 64,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <FotoPopup src={urlArquivo(params.row.fotoUrl)} sx={{ width: 32, height: 32 }} />
      ),
    },
    { field: 'nome', headerName: 'Nome', flex: 1 },
    { field: 'matricula', headerName: 'Matrícula', flex: 1 },
    {
      field: 'acoes',
      headerName: '',
      sortable: false,
      filterable: false,
      width: 150,
      renderCell: (params) => (
        <Button
          size="small"
          variant="contained"
          onClick={() => setAlunoSelecionado(params.row)}
          sx={{
            bgcolor: tokens.yellow,
            color: tokens.yellowText,
            '&:hover': { bgcolor: tokens.yellow, opacity: 0.85 },
          }}
        >
          Pendências
        </Button>
      ),
    },
  ];

  return (
    <>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">Pendências</Typography>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            disabled={baixando === 'pdf'}
            onClick={() => baixarRelatorio('pdf')}
          >
            Gerar relatório (PDF)
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            disabled={baixando === 'xlsx'}
            onClick={() => baixarRelatorio('xlsx')}
          >
            Gerar relatório (Excel)
          </Button>
        </Stack>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Aluno com pendência: reprovado numa disciplina já encerrada. A nota não é alterada — a
        aba "Resolvidas" só marca que o admin já tomou conhecimento do caso.
      </Typography>

      <Tabs value={tab} onChange={(_e, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Pendentes" />
        <Tab label="Resolvidas" />
      </Tabs>

      {tab === 0 && totalSelecionados > 0 && (
        <Box sx={{ mb: 1.5 }}>
          <Button
            variant="outlined"
            startIcon={<DoneAllIcon />}
            disabled={resolverTodas.isPending}
            onClick={resolverSelecionados}
          >
            Marcar {totalSelecionados} selecionado(s) como resolvido(s)
          </Button>
        </Box>
      )}

      <Paper variant="outlined" sx={{ overflowX: 'auto' }}>
        <DataGrid
          rows={data ?? []}
          columns={columns}
          loading={isLoading}
          disableRowSelectionOnClick
          density="compact"
          autoHeight
          showToolbar
          checkboxSelection
          rowSelectionModel={selecionados}
          onRowSelectionModelChange={setSelecionados}
          initialState={{ pagination: { paginationModel: { pageSize: 30 } } }}
        />
      </Paper>

      <DetalhesPendenciasDialog aluno={alunoSelecionado} onClose={() => setAlunoSelecionado(null)} />
    </>
  );
}
