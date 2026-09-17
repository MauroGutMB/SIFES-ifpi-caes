import { useMemo, useState } from 'react';
import {
  Box,
  Button,
  IconButton,
  MenuItem,
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
import GroupAddIcon from '@mui/icons-material/GroupAddOutlined';
import GroupRemoveIcon from '@mui/icons-material/GroupRemoveOutlined';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { isAxiosError } from 'axios';
import { useQueryClient } from '@tanstack/react-query';
import {
  getAlunosControllerFindAllQueryKey,
  useAlunosControllerCreate,
  useAlunosControllerDesligarTurma,
  useAlunosControllerFindAll,
  useAlunosControllerRemove,
  useAlunosControllerUpdate,
  useAlunosControllerVincularTurma,
} from '../../../api/generated/alunos/alunos';
import { useTurmasControllerFindAll } from '../../../api/generated/turmas/turmas';
import { AlunosControllerCreateBody } from '../../../api/generated/zod/alunos/alunos';
import type { AlunoDto } from '../../../api/generated/models';
import { FormDialog } from '../../../components/FormDialog';
import { ConfirmDialog } from '../../../components/ConfirmDialog';
import { SenhaGeradaDialog } from '../../../components/SenhaGeradaDialog';

type FormValues = z.infer<typeof AlunosControllerCreateBody>;

export function AlunosPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useAlunosControllerFindAll();
  const { data: turmas } = useTurmasControllerFindAll();
  const criar = useAlunosControllerCreate();
  const atualizar = useAlunosControllerUpdate();
  const remover = useAlunosControllerRemove();
  const vincularTurma = useAlunosControllerVincularTurma();
  const desligarTurma = useAlunosControllerDesligarTurma();

  const [editando, setEditando] = useState<AlunoDto | null>(null);
  const [dialogAberto, setDialogAberto] = useState(false);
  const [paraExcluir, setParaExcluir] = useState<AlunoDto | null>(null);
  const [paraMatricular, setParaMatricular] = useState<AlunoDto | null>(null);
  const [turmaEscolhida, setTurmaEscolhida] = useState('');
  const [senhaGerada, setSenhaGerada] = useState<{ nome: string; login: string; senha: string } | null>(
    null,
  );
  const [erro, setErro] = useState<string | null>(null);
  const [selecionados, setSelecionados] = useState<GridRowSelectionModel>({
    type: 'include',
    ids: new Set(),
  });
  const [confirmandoExclusaoEmMassa, setConfirmandoExclusaoEmMassa] = useState(false);

  const nomeTurma = useMemo(() => {
    const mapa = new Map((turmas ?? []).map((t) => [t.id, `${t.cursoTecnico} — ${t.anoSerie}`]));
    return (turmaId: string | null) => (turmaId ? (mapa.get(turmaId) ?? turmaId) : '—');
  }, [turmas]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(AlunosControllerCreateBody),
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });

  const invalidar = () =>
    queryClient.invalidateQueries({ queryKey: getAlunosControllerFindAllQueryKey() });

  const abrirNovo = () => {
    setEditando(null);
    reset({ nome: '', matricula: '' });
    setErro(null);
    setDialogAberto(true);
  };

  const abrirEdicao = (aluno: AlunoDto) => {
    setEditando(aluno);
    reset({ nome: aluno.nome, matricula: aluno.matricula });
    setErro(null);
    setDialogAberto(true);
  };

  const salvar = handleSubmit(async (dados) => {
    setErro(null);
    try {
      if (editando) {
        await atualizar.mutateAsync({ id: editando.id, data: dados });
      } else {
        const criado = await criar.mutateAsync({ data: dados });
        setSenhaGerada({ nome: criado.nome, login: criado.matricula, senha: criado.senhaInicial });
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

  const abrirMatricula = (aluno: AlunoDto) => {
    setParaMatricular(aluno);
    setTurmaEscolhida('');
    setErro(null);
  };

  const confirmarMatricula = async () => {
    if (!paraMatricular || !turmaEscolhida) return;
    setErro(null);
    try {
      await vincularTurma.mutateAsync({
        id: paraMatricular.id,
        data: { turmaId: turmaEscolhida },
      });
      await invalidar();
      setParaMatricular(null);
    } catch (error) {
      setErro(
        isAxiosError(error)
          ? ((error.response?.data as { message?: string } | undefined)?.message ??
            'Não foi possível matricular')
          : 'Não foi possível matricular',
      );
    }
  };

  const desligar = async (aluno: AlunoDto) => {
    await desligarTurma.mutateAsync({ id: aluno.id });
    await invalidar();
  };

  const excluirSelecionados = async () => {
    await Promise.all(
      [...selecionados.ids].map((id) => remover.mutateAsync({ id: String(id) })),
    );
    await invalidar();
    setSelecionados({ type: 'include', ids: new Set() });
    setConfirmandoExclusaoEmMassa(false);
  };

  const salvarEdicaoInline = async (linhaNova: AlunoDto, linhaAntiga: AlunoDto) => {
    if (linhaNova.nome === linhaAntiga.nome) return linhaNova;
    await atualizar.mutateAsync({
      id: linhaNova.id,
      data: { nome: linhaNova.nome, matricula: linhaNova.matricula },
    });
    await invalidar();
    return linhaNova;
  };

  const columns: GridColDef<AlunoDto>[] = [
    { field: 'nome', headerName: 'Nome', flex: 1, editable: true },
    { field: 'matricula', headerName: 'Matrícula', flex: 1 },
    {
      field: 'turmaId',
      headerName: 'Turma',
      flex: 1,
      valueFormatter: (value: string | null) => nomeTurma(value),
    },
    {
      field: 'acoes',
      headerName: '',
      sortable: false,
      filterable: false,
      width: 170,
      renderCell: (params) => (
        <Stack direction="row">
          {params.row.turmaId ? (
            <Tooltip title="Desligar da turma">
              <IconButton size="small" onClick={() => desligar(params.row)}>
                <GroupRemoveIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          ) : (
            <Tooltip title="Matricular em turma">
              <IconButton size="small" onClick={() => abrirMatricula(params.row)}>
                <GroupAddIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
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
        <Typography variant="h4">Alunos</Typography>
        <Stack direction="row" spacing={1}>
          {selecionados.ids.size > 0 && (
            <Button
              color="error"
              variant="outlined"
              startIcon={<DeleteSweepIcon />}
              onClick={() => setConfirmandoExclusaoEmMassa(true)}
            >
              Excluir {selecionados.ids.size} selecionado(s)
            </Button>
          )}
          <Button variant="contained" startIcon={<AddIcon />} onClick={abrirNovo}>
            Novo aluno
          </Button>
        </Stack>
      </Box>

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
        initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
      />

      <FormDialog
        open={dialogAberto}
        title={editando ? 'Editar aluno' : 'Novo aluno'}
        subtitle={editando ? undefined : 'O aluno poderá acessar o SIFES assim que o cadastro for salvo.'}
        onClose={() => setDialogAberto(false)}
        onSubmit={salvar}
        error={erro}
        submitting={criar.isPending || atualizar.isPending}
        submitLabel={editando ? 'Salvar aluno' : 'Salvar aluno'}
        submittingLabel="Salvando…"
        isDirty={isDirty}
      >
        <TextField
          {...register('nome')}
          label="Nome completo"
          error={!!errors.nome}
          helperText={errors.nome?.message ?? 'Como aparece nos documentos e no diário'}
          fullWidth
          autoFocus
        />
        <TextField
          {...register('matricula')}
          label="Matrícula"
          error={!!errors.matricula}
          helperText={
            errors.matricula?.message ?? '8 dígitos — também será o login do aluno'
          }
          fullWidth
        />
      </FormDialog>

      <FormDialog
        open={!!paraMatricular}
        title={`Matricular ${paraMatricular?.nome ?? ''}`}
        onClose={() => setParaMatricular(null)}
        onSubmit={confirmarMatricula}
        error={erro}
        submitting={vincularTurma.isPending}
        submitLabel="Matricular"
        submittingLabel="Matriculando…"
      >
        <TextField
          select
          label="Turma"
          value={turmaEscolhida}
          onChange={(e) => setTurmaEscolhida(e.target.value)}
          fullWidth
        >
          {(turmas ?? []).map((turma) => (
            <MenuItem key={turma.id} value={turma.id}>
              {turma.cursoTecnico} — {turma.anoSerie} ({turma.semestre.nome})
            </MenuItem>
          ))}
        </TextField>
      </FormDialog>

      <ConfirmDialog
        open={!!paraExcluir}
        title={`Excluir ${paraExcluir?.nome}?`}
        description="Isso remove o login e todo o histórico dele — notas, frequência e atividades entregues. Não pode ser desfeito."
        confirmLabel="Excluir aluno"
        confirmColor="error"
        loading={remover.isPending}
        onConfirm={excluir}
        onClose={() => setParaExcluir(null)}
        confirmValue={paraExcluir?.matricula}
      />

      <ConfirmDialog
        open={confirmandoExclusaoEmMassa}
        title={`Excluir ${selecionados.ids.size} aluno(s)?`}
        description="Isso remove o login e todo o histórico de cada um — notas, frequência e atividades entregues. Não pode ser desfeito."
        confirmLabel="Excluir selecionados"
        confirmColor="error"
        loading={remover.isPending}
        onConfirm={excluirSelecionados}
        onClose={() => setConfirmandoExclusaoEmMassa(false)}
      />

      {senhaGerada && (
        <SenhaGeradaDialog
          open
          nome={senhaGerada.nome}
          login={senhaGerada.login}
          senha={senhaGerada.senha}
          onClose={() => setSenhaGerada(null)}
        />
      )}
    </>
  );
}
