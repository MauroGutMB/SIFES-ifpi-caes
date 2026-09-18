import { useState } from 'react';
import {
  Box,
  Button,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { DataGrid, type GridColDef, type GridRowSelectionModel } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweepOutlined';
import EditIcon from '@mui/icons-material/EditOutlined';
import DeleteIcon from '@mui/icons-material/DeleteOutlineOutlined';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { isAxiosError } from 'axios';
import { useQueryClient } from '@tanstack/react-query';
import {
  getTurmasControllerFindAllQueryKey,
  useTurmasControllerCreate,
  useTurmasControllerFindAll,
  useTurmasControllerRemove,
  useTurmasControllerUpdate,
} from '../../../api/generated/turmas/turmas';
import { useSemestresControllerFindAll } from '../../../api/generated/semestres/semestres';
import { TurmasControllerCreateBody } from '../../../api/generated/zod/turmas/turmas';
import type { TurmaDto } from '../../../api/generated/models';
import { FormDialog } from '../../../components/FormDialog';
import { ConfirmDialog } from '../../../components/ConfirmDialog';
import { useToast } from '../../../components/ToastProvider';

type FormValues = z.infer<typeof TurmasControllerCreateBody>;

const TURNOS = [
  { value: 'MANHA', label: 'Manhã' },
  { value: 'TARDE', label: 'Tarde' },
] as const;

export function TurmasPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { data, isLoading } = useTurmasControllerFindAll();
  const { data: semestres } = useSemestresControllerFindAll();
  const criar = useTurmasControllerCreate();
  const atualizar = useTurmasControllerUpdate();
  const remover = useTurmasControllerRemove();

  const [editando, setEditando] = useState<TurmaDto | null>(null);
  const [dialogAberto, setDialogAberto] = useState(false);
  const [paraExcluir, setParaExcluir] = useState<TurmaDto | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [selecionados, setSelecionados] = useState<GridRowSelectionModel>({
    type: 'include',
    ids: new Set(),
  });
  const [confirmandoExclusaoEmMassa, setConfirmandoExclusaoEmMassa] = useState(false);

  // A DataGrid alterna para { type: 'exclude', ids } quando "selecionar tudo" é usado
  // (ids vira o conjunto de EXCEÇÕES, não de selecionados) — por isso não dá pra confiar
  // em selecionados.ids.size sozinho, precisa resolver contra as linhas atuais.
  const idsSelecionados =
    selecionados.type === 'include'
      ? [...selecionados.ids].map(String)
      : (data ?? []).map((t) => t.id).filter((id) => !selecionados.ids.has(id));
  const totalSelecionados = idsSelecionados.length;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(TurmasControllerCreateBody) });

  const invalidar = () =>
    queryClient.invalidateQueries({ queryKey: getTurmasControllerFindAllQueryKey() });

  const abrirNovo = () => {
    setEditando(null);
    reset({ semestreId: '', cursoTecnico: '', anoSerie: '', turno: 'MANHA' });
    setErro(null);
    setDialogAberto(true);
  };

  const abrirEdicao = (turma: TurmaDto) => {
    setEditando(turma);
    reset({
      semestreId: turma.semestreId,
      cursoTecnico: turma.cursoTecnico,
      anoSerie: turma.anoSerie,
      turno: turma.turno,
    });
    setErro(null);
    setDialogAberto(true);
  };

  const salvar = handleSubmit(async (dados) => {
    setErro(null);
    try {
      if (editando) {
        await atualizar.mutateAsync({ id: editando.id, data: dados });
        toast.success('Turma atualizada com sucesso');
      } else {
        await criar.mutateAsync({ data: dados });
        toast.success('Turma criada com sucesso');
      }
      await invalidar();
      setDialogAberto(false);
    } catch (error) {
      setErro(
        isAxiosError(error)
          ? ((error.response?.data as { message?: string } | undefined)?.message ??
            'Não foi possível salvar')
          : 'Não foi possível salvar',
      );
    }
  });

  const excluir = async () => {
    if (!paraExcluir) return;
    await remover.mutateAsync({ id: paraExcluir.id });
    await invalidar();
    setParaExcluir(null);
    toast.success('Turma excluída com sucesso');
  };

  const excluirSelecionados = async () => {
    const total = totalSelecionados;
    const resultados = await Promise.allSettled(
      idsSelecionados.map((id) => remover.mutateAsync({ id })),
    );
    await invalidar();
    setSelecionados({ type: 'include', ids: new Set() });
    setConfirmandoExclusaoEmMassa(false);
    const falhas = resultados.filter((r) => r.status === 'rejected').length;
    if (falhas > 0) {
      toast.error(`${falhas} de ${total} exclusões falharam`);
    } else {
      toast.success(`${total} turma(s) excluída(s) com sucesso`);
    }
  };

  const salvarEdicaoInline = async (linhaNova: TurmaDto, linhaAntiga: TurmaDto) => {
    if (linhaNova.cursoTecnico === linhaAntiga.cursoTecnico) return linhaNova;
    await atualizar.mutateAsync({ id: linhaNova.id, data: { cursoTecnico: linhaNova.cursoTecnico } });
    await invalidar();
    return linhaNova;
  };

  const columns: GridColDef<TurmaDto>[] = [
    { field: 'cursoTecnico', headerName: 'Curso técnico', flex: 1, editable: true },
    { field: 'anoSerie', headerName: 'Ano/Série', flex: 1 },
    {
      field: 'turno',
      headerName: 'Turno',
      flex: 1,
      valueFormatter: (value: TurmaDto['turno']) =>
        TURNOS.find((t) => t.value === value)?.label ?? value,
    },
    {
      field: 'semestre',
      headerName: 'Semestre',
      flex: 1,
      valueGetter: (_value, row) => row.semestre.nome,
    },
    {
      field: 'acoes',
      headerName: '',
      sortable: false,
      filterable: false,
      width: 100,
      renderCell: (params) => (
        <Stack direction="row">
          <IconButton size="small" onClick={() => abrirEdicao(params.row)}>
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={() => setParaExcluir(params.row)}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Stack>
      ),
    },
  ];

  return (
    <>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">Turmas</Typography>
        <Stack direction="row" spacing={1}>
          {totalSelecionados > 0 && (
            <Button
              color="error"
              variant="outlined"
              startIcon={<DeleteSweepIcon />}
              onClick={() => setConfirmandoExclusaoEmMassa(true)}
            >
              Excluir {totalSelecionados} selecionado(s)
            </Button>
          )}
          <Button variant="contained" startIcon={<AddIcon />} onClick={abrirNovo}>
            Nova turma
          </Button>
        </Stack>
      </Box>

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
          processRowUpdate={salvarEdicaoInline}
          initialState={{ pagination: { paginationModel: { pageSize: 30 } } }}
        />
      </Paper>

      <FormDialog
        open={dialogAberto}
        title={editando ? 'Editar turma' : 'Nova turma'}
        submitLabel={editando ? 'Salvar turma' : 'Criar turma'}
        onClose={() => setDialogAberto(false)}
        onSubmit={salvar}
        error={erro}
        submitting={criar.isPending || atualizar.isPending}
      >
        <TextField
          {...register('semestreId')}
          select
          label="Semestre"
          error={!!errors.semestreId}
          helperText={errors.semestreId?.message}
          fullWidth
          defaultValue=""
        >
          {(semestres ?? []).map((semestre) => (
            <MenuItem key={semestre.id} value={semestre.id}>
              {semestre.nome}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          {...register('cursoTecnico')}
          label="Curso técnico"
          error={!!errors.cursoTecnico}
          helperText={errors.cursoTecnico?.message}
          fullWidth
        />
        <TextField
          {...register('anoSerie')}
          label="Ano/Série"
          placeholder="1º ano"
          error={!!errors.anoSerie}
          helperText={errors.anoSerie?.message}
          fullWidth
        />
        <TextField
          {...register('turno')}
          select
          label="Turno"
          error={!!errors.turno}
          helperText={errors.turno?.message}
          fullWidth
          defaultValue="MANHA"
        >
          {TURNOS.map((t) => (
            <MenuItem key={t.value} value={t.value}>
              {t.label}
            </MenuItem>
          ))}
        </TextField>
      </FormDialog>

      <ConfirmDialog
        open={!!paraExcluir}
        title="Excluir turma"
        description={`Tem certeza que deseja excluir "${paraExcluir?.cursoTecnico} — ${paraExcluir?.anoSerie}"? Só é possível excluir se não houver disciplinas vinculadas a ela.`}
        confirmLabel="Excluir"
        confirmColor="error"
        loading={remover.isPending}
        onConfirm={excluir}
        onClose={() => setParaExcluir(null)}
      />

      <ConfirmDialog
        open={confirmandoExclusaoEmMassa}
        title={`Excluir ${totalSelecionados} turma(s)?`}
        description="Só é possível excluir turmas sem disciplinas vinculadas. Não pode ser desfeito."
        confirmLabel="Excluir selecionadas"
        confirmColor="error"
        loading={remover.isPending}
        onConfirm={excluirSelecionados}
        onClose={() => setConfirmandoExclusaoEmMassa(false)}
      />
    </>
  );
}
