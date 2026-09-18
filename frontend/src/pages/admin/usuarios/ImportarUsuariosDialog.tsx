import { useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { isAxiosError } from 'axios';
import { useUsersControllerImportar } from '../../../api/generated/users/users';
import type { ImportarUsuariosResultadoDto, UsuarioImportadoDto } from '../../../api/generated/models';

interface ImportarUsuariosDialogProps {
  open: boolean;
  onClose: () => void;
  onImportado: (importados: UsuarioImportadoDto[]) => void;
}

export function ImportarUsuariosDialog({ open, onClose, onImportado }: ImportarUsuariosDialogProps) {
  const importar = useUsersControllerImportar();
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [resultado, setResultado] = useState<ImportarUsuariosResultadoDto | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const enviar = async () => {
    if (!arquivo) return;
    setErro(null);
    try {
      const resposta = await importar.mutateAsync({ data: { arquivo } });
      setResultado(resposta);
      if (resposta.importados.length > 0) onImportado(resposta.importados);
    } catch (error) {
      setErro(
        isAxiosError(error)
          ? ((error.response?.data as { message?: string } | undefined)?.message ??
            'Não foi possível importar o arquivo')
          : 'Não foi possível importar o arquivo',
      );
    }
  };

  const fechar = () => {
    setArquivo(null);
    setResultado(null);
    setErro(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={fechar} fullWidth maxWidth="sm">
      <DialogTitle>Importar usuários</DialogTitle>
      <DialogContent sx={{ overflowX: 'auto' }}>
        {!resultado ? (
          <Stack spacing={2} sx={{ pt: 0.5 }}>
            <Typography variant="body2" color="text.secondary">
              Envie um CSV com as colunas <strong>nome, login, cargo</strong> (cargo deve ser ALUNO ou
              PROFESSOR). Cada usuário é criado com senha inicial gerada automaticamente.
            </Typography>
            <Button component="label" variant="outlined">
              {arquivo ? arquivo.name : 'Escolher arquivo CSV'}
              <input
                type="file"
                hidden
                accept=".csv,text/csv"
                onChange={(e) => setArquivo(e.target.files?.[0] ?? null)}
              />
            </Button>
            {erro && (
              <Typography color="error" variant="body2">
                {erro}
              </Typography>
            )}
          </Stack>
        ) : (
          <Stack spacing={2} sx={{ pt: 0.5 }}>
            {resultado.importados.length > 0 && (
              <Stack spacing={1}>
                <Typography variant="subtitle2">
                  {resultado.importados.length} usuário(s) importado(s)
                </Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Nome</TableCell>
                      <TableCell>Login</TableCell>
                      <TableCell>Cargo</TableCell>
                      <TableCell>Senha inicial</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {resultado.importados.map((item) => (
                      <TableRow key={item.linha}>
                        <TableCell>{item.nome}</TableCell>
                        <TableCell>{item.login}</TableCell>
                        <TableCell>{item.cargo}</TableCell>
                        <TableCell sx={{ fontFamily: 'monospace' }}>{item.senhaInicial}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Stack>
            )}
            {resultado.erros.length > 0 && (
              <Stack spacing={1}>
                <Typography variant="subtitle2" color="error">
                  {resultado.erros.length} linha(s) com erro
                </Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Linha</TableCell>
                      <TableCell>Motivo</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {resultado.erros.map((item) => (
                      <TableRow key={item.linha}>
                        <TableCell>{item.linha}</TableCell>
                        <TableCell>{item.motivo}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Stack>
            )}
            {resultado.importados.length > 0 && (
              <Typography variant="body2" color="text.secondary">
                Você pode ver essas senhas de novo clicando no chip "Sim" da tabela de usuários — mas só
                nesta sessão do navegador.
              </Typography>
            )}
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={fechar}>Fechar</Button>
        {!resultado && (
          <Button variant="contained" disabled={!arquivo || importar.isPending} onClick={enviar}>
            {importar.isPending ? 'Importando…' : 'Importar'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
