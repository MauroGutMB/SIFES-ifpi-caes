import { useState } from 'react';
import { Box, Button, Chip, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { isAxiosError } from 'axios';
import { useQueryClient } from '@tanstack/react-query';
import {
  getUsersControllerFindAllQueryKey,
  useUsersControllerFindAll,
  useUsersControllerRedefinirSenha,
} from '../../../api/generated/users/users';
import type { UserDto } from '../../../api/generated/models';
import { SenhaGeradaDialog } from '../../../components/SenhaGeradaDialog';
import { useToast } from '../../../components/ToastProvider';
import { tokens } from '../../../theme/tokens';

const PAPEIS = [
  { value: '', label: 'Todos' },
  { value: 'ADMIN', label: 'Administrador' },
  { value: 'PROFESSOR', label: 'Professor' },
  { value: 'ALUNO', label: 'Aluno' },
] as const;

function nomeDoUsuario(user: UserDto): string {
  return user.professor?.nome ?? user.aluno?.nome ?? '—';
}

export function UsuariosPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [role, setRole] = useState('');
  const { data, isLoading } = useUsersControllerFindAll(role ? { role } : undefined);
  const redefinirSenha = useUsersControllerRedefinirSenha();
  const [senhaGerada, setSenhaGerada] = useState<{ nome: string; login: string; senha: string } | null>(
    null,
  );

  const redefinir = async (user: UserDto) => {
    try {
      const resultado = await redefinirSenha.mutateAsync({ id: user.id });
      await queryClient.invalidateQueries({ queryKey: getUsersControllerFindAllQueryKey() });
      setSenhaGerada({
        nome: nomeDoUsuario(user),
        login: resultado.login,
        senha: resultado.senhaInicial,
      });
    } catch (error) {
      toast.error(
        isAxiosError(error)
          ? ((error.response?.data as { message?: string } | undefined)?.message ??
            'Não foi possível redefinir a senha')
          : 'Não foi possível redefinir a senha',
      );
    }
  };

  const columns: GridColDef<UserDto>[] = [
    { field: 'nome', headerName: 'Nome', flex: 1, valueGetter: (_v, row) => nomeDoUsuario(row) },
    { field: 'login', headerName: 'Login', flex: 1 },
    {
      field: 'role',
      headerName: 'Papel',
      width: 130,
      renderCell: (params) => <Chip size="small" label={params.value} />,
    },
    {
      field: 'precisaTrocarSenha',
      headerName: 'Precisa trocar senha',
      width: 320,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Chip
            size="small"
            label={params.value ? 'Sim' : 'Não'}
            color={params.value ? 'warning' : 'default'}
          />
          <Button
            size="small"
            variant="contained"
            disabled={!!params.value || redefinirSenha.isPending}
            onClick={() => redefinir(params.row)}
            sx={{
              bgcolor: tokens.yellow,
              color: tokens.yellowText,
              '&:hover': { bgcolor: tokens.yellow, opacity: 0.85 },
              '&.Mui-disabled': { bgcolor: tokens.border, color: tokens.textSecondary },
            }}
          >
            Redefinir senha
          </Button>
        </Stack>
      ),
    },
    {
      field: 'criadoEm',
      headerName: 'Criado em',
      flex: 1,
      valueFormatter: (value: string) => new Date(value).toLocaleString('pt-BR'),
    },
  ];

  return (
    <>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">Usuários</Typography>
        <TextField
          select
          size="small"
          label="Papel"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          sx={{ minWidth: 200 }}
        >
          {PAPEIS.map((papel) => (
            <MenuItem key={papel.value} value={papel.value}>
              {papel.label}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      <Paper variant="outlined">
        <DataGrid
          rows={data ?? []}
          columns={columns}
          loading={isLoading}
          disableRowSelectionOnClick
          density="compact"
          autoHeight
          initialState={{ pagination: { paginationModel: { pageSize: 30 } } }}
        />
      </Paper>

      {senhaGerada && (
        <SenhaGeradaDialog
          open
          titulo={`Senha de ${senhaGerada.nome} redefinida`}
          login={senhaGerada.login}
          senha={senhaGerada.senha}
          onClose={() => setSenhaGerada(null)}
        />
      )}
    </>
  );
}
