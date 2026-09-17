import { useState } from 'react';
import { Box, Button, IconButton, Stack, TextField, Typography } from '@mui/material';
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

type FormValues = z.infer<typeof SemestresControllerCreateBody>;

function paraInputDate(iso: string): string {
  return iso.slice(0, 10);
}

export function SemestresPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useSemestresControllerFindAll();
  const criar = useSemestresControllerCreate();
  const atualizar = useSemestresControllerUpdate();
  const remover = useSemestresControllerRemove();

  const [editando, setEditando] = useState<SemestreDto | null>(null);
  const [dialogAberto, setDialogAberto] = useState(false);
  const [paraExcluir, setParaExcluir] = useState<SemestreDto | null>(null);
  const [erro, setErro] = useState<string | null>(null);

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

  const columns: GridColDef<SemestreDto>[] = [
    { field: 'nome', headerName: 'Nome', flex: 1 },
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
        <Typography variant="h4">Semestres</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={abrirNovo}>
          Novo semestre
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
        title={editando ? 'Editar semestre' : 'Novo semestre'}
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
    </>
  );
}
