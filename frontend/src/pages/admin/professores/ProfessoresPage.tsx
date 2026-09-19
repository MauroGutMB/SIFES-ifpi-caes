import { useState } from 'react';
import { Box, Button, IconButton, Paper, Stack, TextField, Tooltip, Typography } from '@mui/material';
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
  getProfessoresControllerFindAllQueryKey,
  useProfessoresControllerCreate,
  useProfessoresControllerFindAll,
  useProfessoresControllerRemove,
  useProfessoresControllerUpdate,
} from '../../../api/generated/professores/professores';
import { ProfessoresControllerCreateBody } from '../../../api/generated/zod/professores/professores';
import type { ProfessorDto } from '../../../api/generated/models';
import { urlArquivo } from '../../../api/arquivo-url';
import { FormDialog } from '../../../components/FormDialog';
import { ConfirmDialog } from '../../../components/ConfirmDialog';
import { SenhaGeradaDialog } from '../../../components/SenhaGeradaDialog';
import { FotoPopup } from '../../../components/FotoPopup';
import { useToast } from '../../../components/ToastProvider';

type FormValues = z.infer<typeof ProfessoresControllerCreateBody>;

export function ProfessoresPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { data, isLoading } = useProfessoresControllerFindAll();
  const criar = useProfessoresControllerCreate();
  const atualizar = useProfessoresControllerUpdate();
  const remover = useProfessoresControllerRemove();

  const [editando, setEditando] = useState<ProfessorDto | null>(null);
  const [dialogAberto, setDialogAberto] = useState(false);
  const [paraExcluir, setParaExcluir] = useState<ProfessorDto | null>(null);
  const [senhaGerada, setSenhaGerada] = useState<{ login: string; senha: string } | null>(null);
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
      : (data ?? []).map((p) => p.id).filter((id) => !selecionados.ids.has(id));
  const totalSelecionados = idsSelecionados.length;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(ProfessoresControllerCreateBody) });

  const invalidar = () =>
    queryClient.invalidateQueries({ queryKey: getProfessoresControllerFindAllQueryKey() });

  const abrirNovo = () => {
    setEditando(null);
    reset({ nome: '', email: '' });
    setErro(null);
    setDialogAberto(true);
  };

  const abrirEdicao = (professor: ProfessorDto) => {
    setEditando(professor);
    reset({ nome: professor.nome, email: professor.email });
    setErro(null);
    setDialogAberto(true);
  };

  const salvar = handleSubmit(async (dados) => {
    setErro(null);
    try {
      if (editando) {
        await atualizar.mutateAsync({ id: editando.id, data: dados });
        toast.success('Professor atualizado com sucesso');
      } else {
        const criado = await criar.mutateAsync({ data: dados });
        setSenhaGerada({ login: criado.email, senha: criado.senhaInicial });
        toast.success('Professor criado com sucesso');
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
    try {
      await remover.mutateAsync({ id: paraExcluir.id });
      await invalidar();
      setParaExcluir(null);
      toast.success('Professor excluído com sucesso');
    } catch (error) {
      toast.error(
        isAxiosError(error)
          ? ((error.response?.data as { message?: string } | undefined)?.message ??
            'Não foi possível excluir o professor')
          : 'Não foi possível excluir o professor',
      );
    }
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
      toast.success(`${total} professor(es) excluído(s) com sucesso`);
    }
  };

  const salvarEdicaoInline = async (linhaNova: ProfessorDto, linhaAntiga: ProfessorDto) => {
    if (linhaNova.nome === linhaAntiga.nome) return linhaNova;
    await atualizar.mutateAsync({ id: linhaNova.id, data: { nome: linhaNova.nome } });
    await invalidar();
    return linhaNova;
  };

  const columns: GridColDef<ProfessorDto>[] = [
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
    { field: 'nome', headerName: 'Nome', flex: 1, editable: true },
    { field: 'email', headerName: 'E-mail', flex: 1 },
    {
      field: 'acoes',
      headerName: '',
      sortable: false,
      filterable: false,
      width: 100,
      renderCell: (params) => (
        <Stack direction="row">
          <Tooltip title="Editar professor">
            <IconButton
              size="small"
              aria-label="Editar professor"
              onClick={() => abrirEdicao(params.row)}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Excluir professor">
            <IconButton
              size="small"
              aria-label="Excluir professor"
              onClick={() => setParaExcluir(params.row)}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  return (
    <>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">Professores</Typography>
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
            Novo professor
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
        title={editando ? 'Editar professor' : 'Novo professor'}
        submitLabel={editando ? 'Salvar professor' : 'Cadastrar professor'}
        onClose={() => setDialogAberto(false)}
        onSubmit={salvar}
        error={erro}
        submitting={criar.isPending || atualizar.isPending}
      >
        <TextField
          {...register('nome')}
          label="Nome"
          error={!!errors.nome}
          helperText={errors.nome?.message}
          fullWidth
          autoFocus
        />
        <TextField
          {...register('email')}
          label="E-mail (também usado como login)"
          error={!!errors.email}
          helperText={errors.email?.message}
          fullWidth
        />
      </FormDialog>

      <ConfirmDialog
        open={!!paraExcluir}
        title="Excluir professor"
        description={`Tem certeza que deseja excluir "${paraExcluir?.nome}"?`}
        confirmLabel="Excluir"
        confirmColor="error"
        loading={remover.isPending}
        onConfirm={excluir}
        onClose={() => setParaExcluir(null)}
      />

      <ConfirmDialog
        open={confirmandoExclusaoEmMassa}
        title={`Excluir ${totalSelecionados} professor(es)?`}
        description="Isso remove o login e o histórico de cada um — turmas, disciplinas e planos vinculados. Não pode ser desfeito."
        confirmLabel="Excluir selecionados"
        confirmColor="error"
        loading={remover.isPending}
        onConfirm={excluirSelecionados}
        onClose={() => setConfirmandoExclusaoEmMassa(false)}
      />

      {senhaGerada && (
        <SenhaGeradaDialog
          open
          login={senhaGerada.login}
          senha={senhaGerada.senha}
          onClose={() => setSenhaGerada(null)}
        />
      )}
    </>
  );
}
