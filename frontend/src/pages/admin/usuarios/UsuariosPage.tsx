import { useState, type ReactNode } from 'react';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
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
import { InstrucoesExportacaoDialog } from './InstrucoesExportacaoDialog';

const CARGOS = [
  { value: '', label: 'Todos' },
  { value: 'ADMIN', label: 'Administrador' },
  { value: 'PROFESSOR', label: 'Professor' },
  { value: 'ALUNO', label: 'Aluno' },
] as const;

function nomeDoUsuario(user: UserDto): string {
  return user.professor?.nome ?? user.aluno?.nome ?? '—';
}

/** Rótulo pequeno acima + caixa com borda abaixo (mesma linguagem visual do rótulo
 * "Login"/"Senha inicial" do SenhaGeradaDialog) — usada pra importação e exportação. */
function LabeledActionBox({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <Stack spacing={0.5}>
      <Typography
        sx={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: tokens.textSecondary,
        }}
      >
        {titulo}
      </Typography>
      <Paper
        variant="outlined"
        sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1, py: 0.75, borderRadius: 1 }}
      >
        {children}
      </Paper>
    </Stack>
  );
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
  const [instrucoesImportacaoAberto, setInstrucoesImportacaoAberto] = useState(false);
  const [instrucoesExportacaoAberto, setInstrucoesExportacaoAberto] = useState(false);
  const [exportando, setExportando] = useState<'pdf' | 'xlsx' | null>(null);
  const [confirmarRedefinicao, setConfirmarRedefinicao] = useState<UserDto | null>(null);
  // Senhas geradas nesta sessão do navegador, por login — nunca persistidas (o hash no banco
  // não é reversível, então isso é a única forma de "reexibir" a senha depois do diálogo inicial).
  const [senhasGeradas, setSenhasGeradas] = useState<Record<string, string>>({});

  const pedirRedefinicao = (user: UserDto) => {
    // Usuário que já trocou a senha tem algo real a perder (a senha que ele mesmo escolheu) —
    // confirma antes. Quem ainda está na senha temporária não perde nada além dela mesma.
    if (!user.precisaTrocarSenha) {
      setConfirmarRedefinicao(user);
      return;
    }
    void redefinir(user);
  };

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
    if (!senha) {
      toast.error(
        'Senha não disponível nesta sessão — clique em "Redefinir" para gerar uma nova e poder visualizá-la',
      );
      return;
    }
    setSenhaGerada({ titulo: `Senha de ${login}`, login, senha, somenteVisualizacao: true });
  };

  const baixarModelo = async () => {
    try {
      await baixarArquivo('/users/modelo-importacao', 'modelo-importacao-usuarios.csv');
    } catch {
      toast.error('Não foi possível baixar o modelo de importação');
    }
  };

  const exportarUsuarios = async (formato: 'pdf' | 'xlsx') => {
    setExportando(formato);
    try {
      const params = new URLSearchParams({ formato });
      if (role) params.set('role', role);
      await baixarArquivo(`/relatorios/usuarios?${params}`, `usuarios.${formato}`);
    } catch {
      toast.error('Não foi possível exportar os usuários');
    } finally {
      setExportando(null);
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
      renderCell: (params) => (
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Chip
            size="small"
            label={params.value ? 'Sim' : 'Não'}
            color={params.value ? 'warning' : 'default'}
            clickable={!!params.value}
            onClick={params.value ? () => verSenhaGerada(params.row.login) : undefined}
            title={params.value ? 'Ver senha gerada' : undefined}
          />
          <Button
            size="small"
            disabled={redefinirSenha.isPending}
            onClick={() => pedirRedefinicao(params.row)}
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
        <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <LabeledActionBox titulo="Exportação">
            <Button size="small" disabled={exportando === 'pdf'} onClick={() => exportarUsuarios('pdf')}>
              PDF
            </Button>
            <Button size="small" disabled={exportando === 'xlsx'} onClick={() => exportarUsuarios('xlsx')}>
              Excel
            </Button>
            <IconButton
              size="small"
              onClick={() => setInstrucoesExportacaoAberto(true)}
              title="Sobre a exportação"
              aria-label="Sobre a exportação"
            >
              <MenuBookOutlinedIcon fontSize="small" />
            </IconButton>
          </LabeledActionBox>

          <LabeledActionBox titulo="Importação">
            <Button size="small" onClick={baixarModelo}>
              Baixar modelo
            </Button>
            <Button size="small" variant="contained" onClick={() => setImportarAberto(true)}>
              Importar
            </Button>
            <IconButton
              size="small"
              onClick={() => setInstrucoesImportacaoAberto(true)}
              title="Como importar usuários"
              aria-label="Como importar usuários"
            >
              <MenuBookOutlinedIcon fontSize="small" />
            </IconButton>
          </LabeledActionBox>

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

      <InstrucoesImportacaoDialog
        open={instrucoesImportacaoAberto}
        onClose={() => setInstrucoesImportacaoAberto(false)}
      />
      <InstrucoesExportacaoDialog
        open={instrucoesExportacaoAberto}
        onClose={() => setInstrucoesExportacaoAberto(false)}
      />

      <Dialog open={!!confirmarRedefinicao} onClose={() => setConfirmarRedefinicao(null)}>
        <DialogTitle>Redefinir senha de {confirmarRedefinicao && nomeDoUsuario(confirmarRedefinicao)}?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Este usuário já trocou a senha inicial. Redefinir vai gerar uma nova senha temporária,
            desconectar as sessões ativas dele e exigir a troca no próximo acesso.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmarRedefinicao(null)}>Cancelar</Button>
          <Button
            variant="contained"
            color="warning"
            onClick={() => {
              if (confirmarRedefinicao) void redefinir(confirmarRedefinicao);
              setConfirmarRedefinicao(null);
            }}
          >
            Redefinir mesmo assim
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
