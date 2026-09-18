import { useState } from 'react';
import {
  Box,
  Button,
  Chip,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { DataGrid, type GridColDef, type GridRowSelectionModel } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweepOutlined';
import EditIcon from '@mui/icons-material/EditOutlined';
import DeleteIcon from '@mui/icons-material/DeleteOutlineOutlined';
import EventNoteIcon from '@mui/icons-material/EventNoteOutlined';
import LockIcon from '@mui/icons-material/LockOutlined';
import LockOpenIcon from '@mui/icons-material/LockOpenOutlined';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import type { z } from 'zod';
import { isAxiosError } from 'axios';
import { useQueryClient } from '@tanstack/react-query';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ptBR } from 'date-fns/locale/pt-BR';
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
import { useToast } from '../../../components/ToastProvider';

type FormValues = z.infer<typeof MateriasControllerCreateBody>;

function horaParaData(hora: string): Date | null {
  if (!/^\d{2}:\d{2}$/.test(hora)) return null;
  const [h, m] = hora.split(':').map(Number);
  const data = new Date();
  data.setHours(h, m, 0, 0);
  return data;
}

function dataParaHora(data: Date | null): string {
  if (!data) return '';
  // Aulas só começam em hora cheia — o picker só mostra a view de horas, mas zera os minutos
  // aqui também pra nunca deixar passar um valor antigo com minuto não-zero.
  return `${String(data.getHours()).padStart(2, '0')}:00`;
}

export function MateriasPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
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
      : (data ?? []).map((m) => m.id).filter((id) => !selecionados.ids.has(id));
  const totalSelecionados = idsSelecionados.length;

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
        toast.success('Disciplina atualizada com sucesso');
      } else {
        await criar.mutateAsync({ data: dados });
        toast.success('Disciplina criada com sucesso');
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
    toast.success('Disciplina excluída com sucesso');
  };

  const alternarEstado = async (materia: MateriaDto) => {
    if (materia.estado === 'ABERTA') {
      await encerrar.mutateAsync({ id: materia.id });
      toast.success('Disciplina encerrada');
    } else {
      await reabrir.mutateAsync({ id: materia.id });
      toast.success('Disciplina reaberta');
    }
    await invalidar();
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
      toast.success(`${total} disciplina(s) excluída(s) com sucesso`);
    }
  };

  const salvarEdicaoInline = async (linhaNova: MateriaDto, linhaAntiga: MateriaDto) => {
    if (linhaNova.nome === linhaAntiga.nome) return linhaNova;
    await atualizar.mutateAsync({ id: linhaNova.id, data: { nome: linhaNova.nome } });
    await invalidar();
    return linhaNova;
  };

  const columns: GridColDef<MateriaDto>[] = [
    { field: 'nome', headerName: 'Nome', flex: 1, editable: true },
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
          <Tooltip title={params.row.estado === 'ABERTA' ? 'Encerrar disciplina' : 'Reabrir disciplina'}>
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
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">Disciplinas</Typography>
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
            Nova disciplina
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
        title={editando ? 'Editar disciplina' : 'Nova disciplina'}
        subtitle="As mudanças valem a partir do próximo lançamento de aula."
        onClose={() => setDialogAberto(false)}
        onSubmit={salvar}
        error={erro}
        submitting={criar.isPending || atualizar.isPending}
        submitLabel={editando ? 'Salvar disciplina' : 'Criar disciplina'}
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
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
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
                  {DIAS_SEMANA.filter((dia) => dia.value !== 'SABADO').map((dia) => (
                    <MenuItem key={dia.value} value={dia.value}>
                      {dia.label}
                    </MenuItem>
                  ))}
                </TextField>
                <Controller
                  control={control}
                  name={`horarios.${index}.horaInicio`}
                  render={({ field: campo }) => (
                    <TimePicker
                      label="Início"
                      ampm={false}
                      minTime={horaParaData('07:00') ?? undefined}
                      maxTime={horaParaData('17:00') ?? undefined}
                      shouldDisableTime={(valor, view) =>
                        view === 'minutes' && valor.getMinutes() !== 0
                      }
                      value={horaParaData(campo.value)}
                      onChange={(data) => campo.onChange(dataParaHora(data))}
                      slotProps={{
                        textField: {
                          error: !!errors.horarios?.[index]?.horaInicio,
                          sx: { width: 140 },
                        },
                      }}
                    />
                  )}
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
        </LocalizationProvider>
        <Typography sx={{ fontSize: 12, color: tokens.textSecondary, minHeight: 18, mt: 0.75 }}>
          {errors.horarios?.message ?? 'A última linha fica sempre disponível para um novo horário'}
        </Typography>
      </FormDialog>

      <ConfirmDialog
        open={!!paraExcluir}
        title="Excluir disciplina"
        description="Tem certeza que deseja excluir esta disciplina? Isso remove aulas, plano de disciplina e atividades vinculadas."
        confirmLabel="Excluir"
        confirmColor="error"
        loading={remover.isPending}
        onConfirm={excluir}
        onClose={() => setParaExcluir(null)}
      />

      <ConfirmDialog
        open={confirmandoExclusaoEmMassa}
        title={`Excluir ${totalSelecionados} disciplina(s)?`}
        description="Isso remove aulas, plano de disciplina e atividades vinculadas de cada uma. Não pode ser desfeito."
        confirmLabel="Excluir selecionadas"
        confirmColor="error"
        loading={remover.isPending}
        onConfirm={excluirSelecionados}
        onClose={() => setConfirmandoExclusaoEmMassa(false)}
      />

      <AulasOverrideDialog materiaId={aulasDe} onClose={() => setAulasDe(null)} />
    </>
  );
}
