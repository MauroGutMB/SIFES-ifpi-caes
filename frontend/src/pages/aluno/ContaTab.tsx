import { useState } from 'react';
import {
  Avatar,
  Box,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { isAxiosError } from 'axios';
import { useQueryClient } from '@tanstack/react-query';
import { useUsersControllerMe } from '../../api/generated/users/users';
import {
  getFotoSolicitacoesControllerMinhasQueryKey,
  useFotoSolicitacoesControllerMinhas,
  useFotoSolicitacoesControllerSolicitar,
} from '../../api/generated/foto-solicitacoes/foto-solicitacoes';
import type { AlunoMeDto } from '../../api/generated/models';

interface ContaTabProps {
  perfil: AlunoMeDto;
}

const LABEL_STATUS: Record<string, 'warning' | 'success' | 'error'> = {
  PENDENTE: 'warning',
  APROVADA: 'success',
  REJEITADA: 'error',
};

export function ContaTab({ perfil }: ContaTabProps) {
  const queryClient = useQueryClient();
  const { data: me } = useUsersControllerMe();
  const { data: solicitacoes } = useFotoSolicitacoesControllerMinhas();
  const solicitar = useFotoSolicitacoesControllerSolicitar();
  const [erro, setErro] = useState<string | null>(null);

  const enviarFoto = async (arquivo: File) => {
    setErro(null);
    try {
      await solicitar.mutateAsync({ data: { foto: arquivo } });
      await queryClient.invalidateQueries({
        queryKey: getFotoSolicitacoesControllerMinhasQueryKey(),
      });
    } catch (error) {
      setErro(
        isAxiosError(error)
          ? ((error.response?.data as { message?: string } | undefined)?.message ??
            'Não foi possível enviar a foto')
          : 'Não foi possível enviar a foto',
      );
    }
  };

  return (
    <Stack spacing={3} sx={{ maxWidth: 480 }}>
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
          <Avatar src={me?.fotoUrl ?? undefined} sx={{ width: 64, height: 64 }} />
          <div>
            <Typography variant="h6">{perfil.nome}</Typography>
            <Typography variant="body2" color="text.secondary">
              Matrícula: {perfil.matricula}
            </Typography>
          </div>
        </Stack>

        <Box sx={{ mt: 2 }}>
          <Button component="label" variant="outlined" size="small">
            Solicitar troca de foto
            <input
              type="file"
              hidden
              accept="image/*"
              onChange={(e) => {
                const arquivo = e.target.files?.[0];
                if (arquivo) enviarFoto(arquivo);
              }}
            />
          </Button>
          {erro && (
            <Typography color="error" variant="body2" sx={{ mt: 1 }}>
              {erro}
            </Typography>
          )}
        </Box>
      </Paper>

      <div>
        <Typography variant="subtitle1" gutterBottom>
          Solicitações de foto
        </Typography>
        <List dense>
          {(solicitacoes ?? []).map((solicitacao) => (
            <ListItem
              key={solicitacao.id}
              secondaryAction={
                <Chip size="small" label={solicitacao.status} color={LABEL_STATUS[solicitacao.status]} />
              }
            >
              <ListItemText
                primary={new Date(solicitacao.criadaEm).toLocaleString('pt-BR')}
              />
            </ListItem>
          ))}
          {!solicitacoes?.length && (
            <Typography variant="body2" color="text.secondary">
              Nenhuma solicitação enviada ainda.
            </Typography>
          )}
        </List>
      </div>
    </Stack>
  );
}
