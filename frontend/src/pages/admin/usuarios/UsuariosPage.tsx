import { useState } from 'react';
import { Box, Chip, MenuItem, TextField, Typography } from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { useUsersControllerFindAll } from '../../../api/generated/users/users';
import type { UserDto } from '../../../api/generated/models';

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
  const [role, setRole] = useState('');
  const { data, isLoading } = useUsersControllerFindAll(role ? { role } : undefined);

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
      width: 170,
      renderCell: (params) => (params.value ? <Chip size="small" label="Sim" color="warning" /> : '—'),
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

      <DataGrid
        rows={data ?? []}
        columns={columns}
        loading={isLoading}
        disableRowSelectionOnClick
        density="compact"
        autoHeight
        initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
      />
    </>
  );
}
