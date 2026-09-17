import { useState } from 'react';
import { Button, Dialog, DialogContent, DialogTitle, Stack, Typography } from '@mui/material';
import { isAxiosError } from 'axios';
import { useQueryClient } from '@tanstack/react-query';
import {
  getEntregaControllerMinhaEntregaQueryKey,
  useEntregaControllerEntregar,
  useEntregaControllerMinhaEntrega,
} from '../../../api/generated/atividades/atividades';
import type { AtividadeDto } from '../../../api/generated/models';

interface EntregaAlunoDialogProps {
  atividade: AtividadeDto | null;
  onClose: () => void;
}

const LABEL_FORMATO: Record<string, string> = {
  PDF: '.pdf',
  WORD: '.doc/.docx',
  FOTO: 'imagem (.jpg/.png)',
};

export function EntregaAlunoDialog({ atividade, onClose }: EntregaAlunoDialogProps) {
  const queryClient = useQueryClient();
  const atividadeId = atividade?.id ?? '';
  const { data: entrega, isLoading } = useEntregaControllerMinhaEntrega(atividadeId, {
    query: { enabled: !!atividade },
  });
  const entregar = useEntregaControllerEntregar();
  const [erro, setErro] = useState<string | null>(null);

  const enviar = async (arquivo: File) => {
    setErro(null);
    try {
      await entregar.mutateAsync({ id: atividadeId, data: { arquivo } });
      await queryClient.invalidateQueries({
        queryKey: getEntregaControllerMinhaEntregaQueryKey(atividadeId),
      });
    } catch (error) {
      setErro(
        isAxiosError(error)
          ? ((error.response?.data as { message?: string } | undefined)?.message ??
            'Não foi possível enviar a entrega')
          : 'Não foi possível enviar a entrega',
      );
    }
  };

  return (
    <Dialog open={!!atividade} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{atividade?.titulo}</DialogTitle>
      <DialogContent>
        {atividade?.descricao && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {atividade.descricao}
          </Typography>
        )}
        <Typography variant="body2" sx={{ mb: 2 }}>
          Formato exigido: {atividade ? LABEL_FORMATO[atividade.formatoExigido] : ''}
        </Typography>

        {!isLoading && entrega && (
          <Typography variant="body2" sx={{ mb: 2 }}>
            Você já enviou em {new Date(entrega.enviadoEm).toLocaleString('pt-BR')} —{' '}
            <a href={entrega.arquivoUrl} target="_blank" rel="noreferrer">
              ver arquivo
            </a>
          </Typography>
        )}

        <Stack spacing={1}>
          <Button component="label" variant="contained" disabled={entregar.isPending}>
            {entrega ? 'Reenviar' : 'Enviar entrega'}
            <input
              type="file"
              hidden
              onChange={(e) => {
                const arquivo = e.target.files?.[0];
                if (arquivo) enviar(arquivo);
              }}
            />
          </Button>
          {erro && (
            <Typography color="error" variant="body2">
              {erro}
            </Typography>
          )}
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
