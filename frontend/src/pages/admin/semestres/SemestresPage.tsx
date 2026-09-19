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
  getSemestresControllerFindAllQueryKey,
  useSemestresControllerCreate,
  useSemestresControllerFindAll,
  useSemestresControllerRemove,
  useSemestresControllerUpdate,
} from '../../../api/generated/semestres/semestres';
import { SemestresControllerCreateBody } from '../../../api/generated/zod/semestres/semestres';
import type { SemestreDto } from '../../../api/generated/models';
import { FormDialog } from '../../../components/FormDialog';
import { ConfirmDialog } from '../../../components/ConfirmDialog';
import { useToast } from '../../../components/ToastProvider';

type FormValues = z.infer<typeof SemestresControllerCreateBody>;

function paraInputDate(iso: string): string {
  return iso.slice(0, 10);
}

export function SemestresPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { data, isLoading } = useSemestresControllerFindAll();
  const criar = useSemestresControllerCreate();
  const atualizar = useSemestresControllerUpdate();
  const remover = useSemestresControllerRemove();

  const [editando, setEditando] = useState<SemestreDto | null>(null);
  const [dialogAberto, setDialogAberto] = useState(false);
  const [paraExcluir, setParaExcluir] = useState<SemestreDto | null>(null);
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
      : (data ?? []).map((s) => s.id).filter((id) => !selecionados.ids.has(id));
  const totalSelecionados = idsSelecionados.length;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(SemestresControllerCreateBody) });

  const invalidar = () =>
    queryClient.invalidateQueries({ queryKey: getSemestresControllerFindAllQueryKey() });

  const abrirNovo = () => {
    setEditando(null);
    reset({ nome: '', dataInicio: '', dataFim: '' });
    setErro(null);
    setDialogAberto(true);
  };

  const abrirEdicao = (semestre: SemestreDto) => {
    setEditando(semestre);
    reset({
      nome: semestre.nome,
      dataInicio: paraInputDate(semestre.dataInicio),
      dataFim: paraInputDate(semestre.dataFim),
    });
    setErro(null);
    setDialogAberto(true);
  };

  const salvar = handleSubmit(async (dados) => {
    setErro(null);
    try {
      if (editando) {
        await atualizar.mutateAsync({ id: editando.id, data: dados });
        toast.success('Semestre atualizado com sucesso');
      } else {
        await criar.mutateAsync({ data: dados });
        toast.success('Semestre criado com sucesso');
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
      toast.success('Semestre excluído com sucesso');
    } catch (error) {
      toast.error(
        isAxiosError(error)
          ? ((error.response?.data as { message?: string } | undefined)?.message ??
            'Não foi possível excluir o semestre')
          : 'Não foi possível excluir o semestre',
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
      toast.success(`${total} semestre(s) excluído(s) com sucesso`);
    }
  };

  const salvarEdicaoInline = async (linhaNova: SemestreDto, linhaAntiga: SemestreDto) => {
    if (linhaNova.nome === linhaAntiga.nome) return linhaNova;
    await atualizar.mutateAsync({ id: linhaNova.id, data: { nome: linhaNova.nome } });
    await invalidar();
    return linhaNova;
  };

  const columns: GridColDef<SemestreDto>[] = [
    { field: 'nome', headerName: 'Nome', flex: 1, editable: true },
    {
      field: 'dataInicio',
      headerName: 'Início',
      flex: 1,
      valueFormatter: (value: string) => new Date(value).toLocaleDateString('pt-BR'),
    },
    {
      field: 'dataFim',
      headerName: 'Fim',
      flex: 1,
      valueFormatter: (value: string) => new Date(value).toLocaleDateString('pt-BR'),
    },
    {
      field: 'acoes',
      headerName: '',
      sortable: false,
      filterable: false,
      width: 100,
      renderCell: (params) => (
        <Stack direction="row">
          <Tooltip title="Editar semestre">
            <IconButton
              size="small"
              aria-label="Editar semestre"
              onClick={() => abrirEdicao(params.row)}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Excluir semestre">
            <IconButton
              size="small"
              aria-label="Excluir semestre"
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
        <Typography variant="h4">Semestres</Typography>
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
            Novo semestre
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
        title={editando ? 'Editar semestre' : 'Novo semestre'}
        submitLabel={editando ? 'Salvar semestre' : 'Criar semestre'}
        onClose={() => setDialogAberto(false)}
        onSubmit={salvar}
        error={erro}
        submitting={criar.isPending || atualizar.isPending}
      >
        <TextField
          {...register('nome')}
          label="Nome (formato AAAA/1 ou AAAA/2)"
          placeholder="2026/1"
          error={!!errors.nome}
          helperText={errors.nome?.message}
          fullWidth
        />
        <TextField
          {...register('dataInicio')}
          label="Data de início"
          type="date"
          slotProps={{ inputLabel: { shrink: true } }}
          error={!!errors.dataInicio}
          helperText={errors.dataInicio?.message}
          fullWidth
        />
        <TextField
          {...register('dataFim')}
          label="Data de fim"
          type="date"
          slotProps={{ inputLabel: { shrink: true } }}
          error={!!errors.dataFim}
          helperText={errors.dataFim?.message}
          fullWidth
        />
      </FormDialog>

      <ConfirmDialog
        open={!!paraExcluir}
        title="Excluir semestre"
        description={`Tem certeza que deseja excluir o semestre "${paraExcluir?.nome}"? Só é possível excluir se não houver turmas vinculadas a ele.`}
        confirmLabel="Excluir"
        confirmColor="error"
        loading={remover.isPending}
        onConfirm={excluir}
        onClose={() => setParaExcluir(null)}
      />

      <ConfirmDialog
        open={confirmandoExclusaoEmMassa}
        title={`Excluir ${totalSelecionados} semestre(s)?`}
        description="Só é possível excluir semestres sem turmas vinculadas. Não pode ser desfeito."
        confirmLabel="Excluir selecionados"
        confirmColor="error"
        loading={remover.isPending}
        onConfirm={excluirSelecionados}
        onClose={() => setConfirmandoExclusaoEmMassa(false)}
      />
    </>
  );
}
