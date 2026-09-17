import { useState } from 'react';
import { Button, Chip, Paper, Stack, Typography } from '@mui/material';
import { useMateriaAulasControllerFindAll } from '../../../api/generated/aulas/aulas';
import { AulaDialog } from './AulaDialog';

interface LancarAulaTabProps {
  materiaId: string;
}

function hojeBrasiliaISO(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());
}

export function LancarAulaTab({ materiaId }: LancarAulaTabProps) {
  const { data, isLoading } = useMateriaAulasControllerFindAll(materiaId);
  const [aulaSelecionada, setAulaSelecionada] = useState<string | null>(null);

  const aulas = data ?? [];
  const hoje = hojeBrasiliaISO();
  const aulaDeHoje = aulas.find((a) => a.data.slice(0, 10) === hoje);
  const ultimaLancada = [...aulas].reverse().find((a) => a.estado === 'LANCADO');

  if (isLoading) return null;

  return (
    <Stack spacing={3} sx={{ maxWidth: 560 }}>
      <div>
        <Typography variant="subtitle1" gutterBottom>
          Aula de hoje
        </Typography>
        <Paper variant="outlined" sx={{ p: 2 }}>
          {aulaDeHoje ? (
            <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', rowGap: 1 }}>
              <div>
                <Typography>{new Date(aulaDeHoje.data).toLocaleDateString('pt-BR')}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {aulaDeHoje.titulo ?? 'Sem título ainda'}
                </Typography>
              </div>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <Chip
                  size="small"
                  label={aulaDeHoje.estado === 'LANCADO' ? 'Lançada' : 'Não lançada'}
                  color={aulaDeHoje.estado === 'LANCADO' ? 'success' : 'default'}
                />
                <Button variant="contained" size="small" onClick={() => setAulaSelecionada(aulaDeHoje.id)}>
                  Lançar aula
                </Button>
              </Stack>
            </Stack>
          ) : (
            <Typography color="text.secondary" variant="body2">
              Não há aula prevista para hoje neste horário.
            </Typography>
          )}
        </Paper>
      </div>

      <div>
        <Typography variant="subtitle1" gutterBottom>
          Última aula lançada
        </Typography>
        <Paper variant="outlined" sx={{ p: 2 }}>
          {ultimaLancada ? (
            <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography>{new Date(ultimaLancada.data).toLocaleDateString('pt-BR')}</Typography>
              <Button variant="outlined" size="small" onClick={() => setAulaSelecionada(ultimaLancada.id)}>
                Abrir
              </Button>
            </Stack>
          ) : (
            <Typography color="text.secondary" variant="body2">
              Nenhuma aula lançada ainda.
            </Typography>
          )}
        </Paper>
      </div>

      <AulaDialog aulaId={aulaSelecionada} onClose={() => setAulaSelecionada(null)} />
    </Stack>
  );
}
