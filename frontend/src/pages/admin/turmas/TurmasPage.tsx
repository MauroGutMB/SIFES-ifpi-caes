import { useState } from 'react';
import {
  Box,
  Button,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
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

type FormValues = z.infer<typeof TurmasControllerCreateBody>;

const TURNOS = [
  { value: 'MANHA', label: 'Manhã' },
  { value: 'TARDE', label: 'Tarde' },
] as const;

export function TurmasPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useTurmasControllerFindAll();
  const { data: semestres } = useSemestresControllerFindAll();
  const criar = useTurmasControllerCreate();
  const atualizar = useTurmasControllerUpdate();
  const remover = useTurmasControllerRemove();

  const [editando, setEditando] = useState<TurmaDto | null>(null);
  const [dialogAberto, setDialogAberto] = useState(false);
  const [paraExcluir, setParaExcluir] = useState<TurmaDto | null>(null);
  const [erro, setErro] = useState<string | null>(null);

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
      } else {
        await criar.mutateAsync({ data: dados });
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
  };

  const columns: GridColDef<TurmaDto>[] = [
    { field: 'cursoTecnico', headerName: 'Curso técnico', flex: 1 },
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">Turmas</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={abrirNovo}>
          Nova turma
        </Button>
      </Box>

      <DataGrid
        rows={data ?? []}
        columns={columns}
        loading={isLoading}
        disableRowSelectionOnClick
        autoHeight
        initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
      />

      <FormDialog
        open={dialogAberto}
        title={editando ? 'Editar turma' : 'Nova turma'}
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
        description={`Tem certeza que deseja excluir "${paraExcluir?.cursoTecnico} — ${paraExcluir?.anoSerie}"? Só é possível excluir se não houver matérias vinculadas a ela.`}
        confirmLabel="Excluir"
        confirmColor="error"
        loading={remover.isPending}
        onConfirm={excluir}
        onClose={() => setParaExcluir(null)}
      />
    </>
  );
}
