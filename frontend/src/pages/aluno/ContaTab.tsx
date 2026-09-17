import { useState } from 'react';
import { Avatar, Box, Button, Chip, Paper, Stack, Typography } from '@mui/material';
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

export function ContaTab({ perfil }: ContaTabProps) {
  const queryClient = useQueryClient();
  const { data: me } = useUsersControllerMe();
  const { data: solicitacoes } = useFotoSolicitacoesControllerMinhas();
  const solicitar = useFotoSolicitacoesControllerSolicitar();
  const [erro, setErro] = useState<string | null>(null);

  // O aluno não vê a lista de solicitações enviadas — só se há uma pendente agora, pra saber
  // se o próximo envio cria uma solicitação nova ou substitui a foto da que já está em análise.
  const pendente = solicitacoes?.some((s) => s.status === 'PENDENTE') ?? false;

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
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Button component="label" variant="outlined" size="small">
              {pendente ? 'Editar foto enviada' : 'Solicitar troca de foto'}
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
            {pendente && <Chip size="small" label="Em análise" color="warning" />}
          </Stack>
          {pendente && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Sua foto enviada está aguardando aprovação. Você pode enviar outra pra
              substituir, mas não pode ter duas solicitações ao mesmo tempo.
            </Typography>
          )}
          {erro && (
            <Typography color="error" variant="body2" sx={{ mt: 1 }}>
              {erro}
            </Typography>
          )}
        </Box>
      </Paper>
    </Stack>
  );
}
