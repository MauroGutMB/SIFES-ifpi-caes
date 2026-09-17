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
  getProfessoresControllerFindAllQueryKey,
  useProfessoresControllerCreate,
  useProfessoresControllerFindAll,
  useProfessoresControllerRemove,
  useProfessoresControllerUpdate,
} from '../../../api/generated/professores/professores';
import { ProfessoresControllerCreateBody } from '../../../api/generated/zod/professores/professores';
import type { ProfessorDto } from '../../../api/generated/models';
import { FormDialog } from '../../../components/FormDialog';
import { ConfirmDialog } from '../../../components/ConfirmDialog';
import { SenhaGeradaDialog } from '../../../components/SenhaGeradaDialog';

type FormValues = z.infer<typeof ProfessoresControllerCreateBody>;

export function ProfessoresPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useProfessoresControllerFindAll();
  const criar = useProfessoresControllerCreate();
  const atualizar = useProfessoresControllerUpdate();
  const remover = useProfessoresControllerRemove();

  const [editando, setEditando] = useState<ProfessorDto | null>(null);
  const [dialogAberto, setDialogAberto] = useState(false);
  const [paraExcluir, setParaExcluir] = useState<ProfessorDto | null>(null);
  const [senhaGerada, setSenhaGerada] = useState<{ login: string; senha: string } | null>(null);
  const [erro, setErro] = useState<string | null>(null);

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
      } else {
        const criado = await criar.mutateAsync({ data: dados });
        setSenhaGerada({ login: criado.email, senha: criado.senhaInicial });
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

  const columns: GridColDef<ProfessorDto>[] = [
    { field: 'nome', headerName: 'Nome', flex: 1 },
    { field: 'email', headerName: 'E-mail', flex: 1 },
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
        <Typography variant="h4">Professores</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={abrirNovo}>
          Novo professor
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
