import { useState } from 'react';
import { Box, Button, Chip, IconButton, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { isAxiosError } from 'axios';
import { useQueryClient } from '@tanstack/react-query';
import {
  getUsersControllerFindAllQueryKey,
  useUsersControllerFindAll,
  useUsersControllerRedefinirSenha,
} from '../../../api/generated/users/users';
import type { UserDto, UsuarioImportadoDto } from '../../../api/generated/models';
import { SenhaGeradaDialog } from '../../../components/SenhaGeradaDialog';
import { useToast } from '../../../components/ToastProvider';
import { baixarArquivo } from '../../../api/download';
import { tokens } from '../../../theme/tokens';
import { ImportarUsuariosDialog } from './ImportarUsuariosDialog';
import { InstrucoesImportacaoDialog } from './InstrucoesImportacaoDialog';

const CARGOS = [
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
  const [senhaGerada, setSenhaGerada] = useState<{
    nome?: string;
    titulo?: string;
    login: string;
    senha: string;
    somenteVisualizacao?: boolean;
  } | null>(null);
  const [importarAberto, setImportarAberto] = useState(false);
  const [instrucoesAberto, setInstrucoesAberto] = useState(false);
  // Senhas geradas nesta sessão do navegador, por login — nunca persistidas (o hash no banco
  // não é reversível, então isso é a única forma de "reexibir" a senha depois do diálogo inicial).
  const [senhasGeradas, setSenhasGeradas] = useState<Record<string, string>>({});

  const redefinir = async (user: UserDto) => {
    try {
      const resultado = await redefinirSenha.mutateAsync({ id: user.id });
      await queryClient.invalidateQueries({ queryKey: getUsersControllerFindAllQueryKey() });
      setSenhasGeradas((atual) => ({ ...atual, [resultado.login]: resultado.senhaInicial }));
      setSenhaGerada({
        titulo: `Senha de ${nomeDoUsuario(user)} redefinida`,
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

  const verSenhaGerada = (login: string) => {
    const senha = senhasGeradas[login];
    if (!senha) return;
    setSenhaGerada({ titulo: `Senha de ${login}`, login, senha, somenteVisualizacao: true });
  };

  const baixarModelo = async () => {
    try {
      await baixarArquivo('/users/modelo-importacao', 'modelo-importacao-usuarios.csv');
    } catch {
      toast.error('Não foi possível baixar o modelo de importação');
    }
  };

  const aoImportar = async (importados: UsuarioImportadoDto[]) => {
    setSenhasGeradas((atual) => {
      const novo = { ...atual };
      for (const item of importados) novo[item.login] = item.senhaInicial;
      return novo;
    });
    await queryClient.invalidateQueries({ queryKey: getUsersControllerFindAllQueryKey() });
    toast.success(`${importados.length} usuário(s) importado(s) com sucesso`);
  };

  const columns: GridColDef<UserDto>[] = [
    { field: 'nome', headerName: 'Nome', flex: 1, valueGetter: (_v, row) => nomeDoUsuario(row) },
    { field: 'login', headerName: 'Login', flex: 1 },
    {
      field: 'role',
      headerName: 'Cargo',
      width: 130,
      renderCell: (params) => <Chip size="small" label={params.value} />,
    },
    {
      field: 'precisaTrocarSenha',
      headerName: 'Precisa trocar senha',
      width: 260,
      sortable: false,
      filterable: false,
      renderCell: (params) => {
        const senhaDisponivel = !!senhasGeradas[params.row.login];
        return (
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Chip
              size="small"
              label={params.value ? 'Sim' : 'Não'}
              color={params.value ? 'warning' : 'default'}
              clickable={!!params.value && senhaDisponivel}
              onClick={
                params.value && senhaDisponivel ? () => verSenhaGerada(params.row.login) : undefined
              }
              title={
                params.value && senhaDisponivel ? 'Ver senha gerada nesta sessão' : undefined
              }
            />
            <Button
              size="small"
              disabled={!!params.value || redefinirSenha.isPending}
              onClick={() => redefinir(params.row)}
              sx={{
                minWidth: 0,
                px: 1,
                py: 0.25,
                fontSize: 12,
                bgcolor: tokens.yellow,
                color: tokens.yellowText,
                '&:hover': { bgcolor: tokens.yellow, opacity: 0.85 },
                '&.Mui-disabled': { bgcolor: tokens.border, color: tokens.textSecondary },
              }}
            >
              Redefinir
            </Button>
          </Stack>
        );
      },
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
        <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap', alignItems: 'center' }}>
          <Paper
            variant="outlined"
            sx={{ display: 'flex', gap: 1, alignItems: 'center', p: 1 }}
          >
            <Button size="small" variant="outlined" onClick={baixarModelo}>
              Baixar modelo de importação
            </Button>
            <Button size="small" variant="contained" onClick={() => setImportarAberto(true)}>
              Importar usuários
            </Button>
            <IconButton
              size="small"
              onClick={() => setInstrucoesAberto(true)}
              title="Como importar usuários"
              aria-label="Como importar usuários"
            >
              <MenuBookOutlinedIcon fontSize="small" />
            </IconButton>
          </Paper>
          <TextField
            select
            size="small"
            label="Cargo"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            sx={{ minWidth: 200 }}
          >
            {CARGOS.map((cargo) => (
              <MenuItem key={cargo.value} value={cargo.value}>
                {cargo.label}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
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
          nome={senhaGerada.nome}
          titulo={senhaGerada.titulo}
          login={senhaGerada.login}
          senha={senhaGerada.senha}
          somenteVisualizacao={senhaGerada.somenteVisualizacao}
          onClose={() => setSenhaGerada(null)}
        />
      )}

      <ImportarUsuariosDialog
        open={importarAberto}
        onClose={() => setImportarAberto(false)}
        onImportado={(importados) => void aoImportar(importados)}
      />

      <InstrucoesImportacaoDialog open={instrucoesAberto} onClose={() => setInstrucoesAberto(false)} />
    </>
  );
}
