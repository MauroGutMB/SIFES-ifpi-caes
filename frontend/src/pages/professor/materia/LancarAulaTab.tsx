import { useState } from 'react';
import { Button, Chip, Paper, Stack, Typography } from '@mui/material';
import { useMateriaAulasControllerFindAll } from '../../../api/generated/aulas/aulas';
import type { AulaDto } from '../../../api/generated/models';
import { AulaDialog } from './AulaDialog';

interface LancarAulaTabProps {
  materiaId: string;
}

const ULTIMAS_AULAS_LIMITE = 5;

function hojeBrasiliaISO(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());
}

function formatarDataHora(aula: AulaDto): string {
  const data = new Date(aula.data).toLocaleDateString('pt-BR');
  const hora = new Date(aula.horaInicio).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  });
  return `${data} - ${hora}`;
}

export function LancarAulaTab({ materiaId }: LancarAulaTabProps) {
  const { data, isLoading } = useMateriaAulasControllerFindAll(materiaId);
  const [aulaSelecionada, setAulaSelecionada] = useState<string | null>(null);

  const aulas = data ?? [];
  const hoje = hojeBrasiliaISO();
  // O horário só serve pra decidir QUAL aula é a de hoje — o estado dela (lançada ou não)
  // continua vindo só de ter frequência registrada, nunca do horário em si.
  const aulasDeHoje = aulas.filter((a) => a.data.slice(0, 10) === hoje);
  const ultimasAulas = aulas
    .filter((a) => a.data.slice(0, 10) < hoje)
    .slice(-ULTIMAS_AULAS_LIMITE)
    .reverse();

  if (isLoading) return null;

  return (
    <Stack spacing={3} sx={{ maxWidth: 560 }}>
      <div>
        <Typography variant="subtitle1" gutterBottom>
          Aulas de hoje
        </Typography>
        <Paper variant="outlined">
          {aulasDeHoje.length === 0 ? (
            <Typography color="text.secondary" variant="body2" sx={{ p: 2 }}>
              Não há aula prevista para hoje neste horário.
            </Typography>
          ) : (
            <Stack divider={<Stack sx={{ borderTop: 1, borderColor: 'divider' }} />}>
              {aulasDeHoje.map((aula) => (
                <Stack
                  key={aula.id}
                  direction="row"
                  sx={{ alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', rowGap: 1, p: 2 }}
                >
                  <div>
                    <Typography>{formatarDataHora(aula)}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {aula.titulo ?? 'Sem título ainda'}
                    </Typography>
                  </div>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <Chip
                      size="small"
                      label={aula.estado === 'LANCADO' ? 'Lançada' : 'Não lançada'}
                      color={aula.estado === 'LANCADO' ? 'success' : 'default'}
                    />
                    <Button variant="contained" size="small" onClick={() => setAulaSelecionada(aula.id)}>
                      {aula.estado === 'LANCADO' ? 'Editar aula' : 'Lançar aula'}
                    </Button>
                  </Stack>
                </Stack>
              ))}
            </Stack>
          )}
        </Paper>
      </div>

      <div>
        <Typography variant="subtitle1" gutterBottom>
          Últimas aulas
        </Typography>
        <Paper variant="outlined">
          {ultimasAulas.length === 0 ? (
            <Typography color="text.secondary" variant="body2" sx={{ p: 2 }}>
              Nenhuma aula anterior ainda.
            </Typography>
          ) : (
            <Stack divider={<Stack sx={{ borderTop: 1, borderColor: 'divider' }} />}>
              {ultimasAulas.map((aula) => (
                <Stack
                  key={aula.id}
                  direction="row"
                  sx={{ alignItems: 'center', justifyContent: 'space-between', p: 2 }}
                >
                  <Typography>{formatarDataHora(aula)}</Typography>
                  <Button variant="outlined" size="small" onClick={() => setAulaSelecionada(aula.id)}>
                    Abrir
                  </Button>
                </Stack>
              ))}
            </Stack>
          )}
        </Paper>
      </div>

      <AulaDialog aulaId={aulaSelecionada} onClose={() => setAulaSelecionada(null)} />
    </Stack>
  );
}
