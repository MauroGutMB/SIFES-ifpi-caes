import { useState } from 'react';
import {
  Box,
  Button,
  Chip,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/EditOutlined';
import DeleteIcon from '@mui/icons-material/DeleteOutlineOutlined';
import EventNoteIcon from '@mui/icons-material/EventNoteOutlined';
import LockIcon from '@mui/icons-material/LockOutlined';
import LockOpenIcon from '@mui/icons-material/LockOpenOutlined';
import { zodResolver } from '@hookform/resolvers/zod';
import { useFieldArray, useForm } from 'react-hook-form';
import type { z } from 'zod';
import { isAxiosError } from 'axios';
import { useQueryClient } from '@tanstack/react-query';
import {
  getMateriasControllerFindAllQueryKey,
  useMateriasControllerCreate,
  useMateriasControllerEncerrar,
  useMateriasControllerFindAll,
  useMateriasControllerReabrir,
  useMateriasControllerRemove,
  useMateriasControllerUpdate,
} from '../../../api/generated/materias/materias';
import { useTurmasControllerFindAll } from '../../../api/generated/turmas/turmas';
import { useProfessoresControllerFindAll } from '../../../api/generated/professores/professores';
import { MateriasControllerCreateBody } from '../../../api/generated/zod/materias/materias';
import type { MateriaDto } from '../../../api/generated/models';
import { FormDialog } from '../../../components/FormDialog';
import { ConfirmDialog } from '../../../components/ConfirmDialog';
import { tokens } from '../../../theme/tokens';
import { DIAS_SEMANA, resumoHorarios } from './dias-semana';
import { AulasOverrideDialog } from './AulasOverrideDialog';

type FormValues = z.infer<typeof MateriasControllerCreateBody>;

export function MateriasPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useMateriasControllerFindAll();
  const { data: turmas } = useTurmasControllerFindAll();
  const { data: professores } = useProfessoresControllerFindAll();
  const criar = useMateriasControllerCreate();
  const atualizar = useMateriasControllerUpdate();
  const remover = useMateriasControllerRemove();
  const encerrar = useMateriasControllerEncerrar();
  const reabrir = useMateriasControllerReabrir();

  const [editando, setEditando] = useState<MateriaDto | null>(null);
  const [dialogAberto, setDialogAberto] = useState(false);
  const [paraExcluir, setParaExcluir] = useState<MateriaDto | null>(null);
  const [aulasDe, setAulasDe] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    setFocus,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(MateriasControllerCreateBody),
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'horarios' });

  const invalidar = () =>
    queryClient.invalidateQueries({ queryKey: getMateriasControllerFindAllQueryKey() });

  const abrirNovo = () => {
    setEditando(null);
    reset({
      nome: '',
      turmaId: '',
      professorId: '',
      cargaHorariaReferencia: 60,
      horarios: [{ diaSemana: 'SEGUNDA', horaInicio: '08:00' }],
    });
    setErro(null);
    setDialogAberto(true);
  };

  const abrirEdicao = (materia: MateriaDto) => {
    setEditando(materia);
    reset({
      nome: materia.nome,
      turmaId: materia.turmaId,
      professorId: materia.professorId,
      cargaHorariaReferencia: materia.cargaHorariaReferencia,
      horarios: materia.horarios.map((h) => ({
        diaSemana: h.diaSemana,
        horaInicio: h.horaInicio,
      })),
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

  const alternarEstado = async (materia: MateriaDto) => {
    if (materia.estado === 'ABERTA') {
      await encerrar.mutateAsync({ id: materia.id });
    } else {
      await reabrir.mutateAsync({ id: materia.id });
    }
    await invalidar();
  };

  const columns: GridColDef<MateriaDto>[] = [
    { field: 'nome', headerName: 'Nome', flex: 1 },
    {
      field: 'turma',
      headerName: 'Turma',
      flex: 1,
      valueGetter: (_value, row) => `${row.turma.cursoTecnico} — ${row.turma.anoSerie}`,
    },
    {
      field: 'professor',
      headerName: 'Professor',
      flex: 1,
      valueGetter: (_value, row) => row.professor.nome,
    },
    {
      field: 'horarios',
      headerName: 'Horários',
      flex: 1,
      valueGetter: (_value, row) => resumoHorarios(row.horarios),
    },
    { field: 'cargaHorariaReferencia', headerName: 'Carga (h)', width: 100 },
    {
      field: 'estado',
      headerName: 'Estado',
      width: 130,
      renderCell: (params) => (
        <Chip
          size="small"
          label={params.value === 'ABERTA' ? 'Aberta' : 'Encerrada'}
          color={params.value === 'ABERTA' ? 'success' : 'default'}
        />
      ),
    },
    {
      field: 'acoes',
      headerName: '',
      sortable: false,
      filterable: false,
      width: 180,
      renderCell: (params) => (
        <Stack direction="row">
          <Tooltip title="Aulas / override de estado">
            <IconButton size="small" onClick={() => setAulasDe(params.row.id)}>
              <EventNoteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={params.row.estado === 'ABERTA' ? 'Encerrar matéria' : 'Reabrir matéria'}>
            <IconButton size="small" onClick={() => alternarEstado(params.row)}>
              {params.row.estado === 'ABERTA' ? (
                <LockIcon fontSize="small" />
              ) : (
                <LockOpenIcon fontSize="small" />
              )}
            </IconButton>
          </Tooltip>
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
        <Typography variant="h4">Matérias</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={abrirNovo}>
          Nova matéria
        </Button>
      </Box>

      <DataGrid
        rows={data ?? []}
        columns={columns}
        loading={isLoading}
        disableRowSelectionOnClick
        density="compact"
        autoHeight
        initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
      />

      <FormDialog
        open={dialogAberto}
        title={editando ? 'Editar matéria' : 'Nova matéria'}
        subtitle="As mudanças valem a partir do próximo lançamento de aula."
        onClose={() => setDialogAberto(false)}
        onSubmit={salvar}
        error={erro}
        submitting={criar.isPending || atualizar.isPending}
        submitLabel={editando ? 'Salvar matéria' : 'Criar matéria'}
        width={520}
        isDirty={isDirty}
      >
        <TextField
          {...register('nome')}
          label="Nome"
          placeholder="Matemática"
          error={!!errors.nome}
          helperText={errors.nome?.message}
          fullWidth
          autoFocus
        />
        <TextField
          {...register('turmaId')}
          select
          label="Turma"
          error={!!errors.turmaId}
          helperText={errors.turmaId?.message}
          fullWidth
          defaultValue=""
        >
          {(turmas ?? []).map((turma) => (
            <MenuItem key={turma.id} value={turma.id}>
              {turma.cursoTecnico} — {turma.anoSerie} ({turma.semestre.nome})
            </MenuItem>
          ))}
        </TextField>
        <TextField
          {...register('professorId')}
          select
          label="Professor"
          error={!!errors.professorId}
          helperText={errors.professorId?.message}
          fullWidth
          defaultValue=""
        >
          {(professores ?? []).map((professor) => (
            <MenuItem key={professor.id} value={professor.id}>
              {professor.nome}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          {...register('cargaHorariaReferencia', { valueAsNumber: true })}
          label="Carga horária de referência (horas)"
          type="number"
          error={!!errors.cargaHorariaReferencia}
          helperText={errors.cargaHorariaReferencia?.message}
          fullWidth
        />

        <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.75 }}>Horários</Typography>
        <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.75, bgcolor: '#FAFBFA' }}>
          <Stack spacing={1}>
            {fields.map((field, index) => (
              <Stack key={field.id} direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <TextField
                  {...register(`horarios.${index}.diaSemana`)}
                  select
                  label="Dia"
                  error={!!errors.horarios?.[index]?.diaSemana}
                  sx={{ width: 170 }}
                  defaultValue={field.diaSemana}
                >
                  {DIAS_SEMANA.map((dia) => (
                    <MenuItem key={dia.value} value={dia.value}>
                      {dia.label}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  {...register(`horarios.${index}.horaInicio`)}
                  label="Início"
                  type="time"
                  slotProps={{ inputLabel: { shrink: true } }}
                  error={!!errors.horarios?.[index]?.horaInicio}
                  sx={{ width: 120 }}
                />
                <IconButton
                  onClick={() => remove(index)}
                  disabled={fields.length <= 1}
                  aria-label="Remover horário"
                  sx={{
                    width: 34,
                    height: 34,
                    border: '1px solid',
                    borderColor: tokens.fieldBorder,
                    borderRadius: 1,
                    bgcolor: '#fff',
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Stack>
            ))}
          </Stack>
          <Button
            size="small"
            startIcon={<AddIcon />}
            onClick={() => {
              append({ diaSemana: 'SEGUNDA', horaInicio: '08:00' });
              window.setTimeout(() => setFocus(`horarios.${fields.length}.diaSemana`), 0);
            }}
            sx={{ mt: 1, color: 'primary.main', fontWeight: 600 }}
          >
            Adicionar horário
          </Button>
        </Box>
        <Typography sx={{ fontSize: 12, color: tokens.textSecondary, minHeight: 18, mt: 0.75 }}>
          {errors.horarios?.message ?? 'A última linha fica sempre disponível para um novo horário'}
        </Typography>
      </FormDialog>

      <ConfirmDialog
        open={!!paraExcluir}
        title="Excluir matéria"
        description="Tem certeza que deseja excluir esta matéria? Isso remove aulas, plano de disciplina e atividades vinculadas."
        confirmLabel="Excluir"
        confirmColor="error"
        loading={remover.isPending}
        onConfirm={excluir}
        onClose={() => setParaExcluir(null)}
      />

      <AulasOverrideDialog materiaId={aulasDe} onClose={() => setAulasDe(null)} />
    </>
  );
}
