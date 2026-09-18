import { useMemo, useState } from 'react';
import {
  Button,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { useAlunosControllerMeuPerfil } from '../../api/generated/alunos/alunos';
import { useMateriasControllerFindAll } from '../../api/generated/materias/materias';
import { useRelatoriosControllerFrequenciaTurmaDetalhada } from '../../api/generated/relatorios/relatorios';
import { usePaginacao } from '../../components/usePaginacao';
import { Paginacao } from '../../components/Paginacao';

const LABEL_STATUS: Record<string, { label: string; color: 'success' | 'error' | 'default' }> = {
  PRESENTE: { label: 'Presente', color: 'success' },
  FALTA: { label: 'Falta', color: 'error' },
  FALTA_JUSTIFICADA: { label: 'Falta justificada', color: 'default' },
};

export function FrequenciaTab() {
  const { data: perfil } = useAlunosControllerMeuPerfil();
  const { data: materias } = useMateriasControllerFindAll();
  const [materiaId, setMateriaId] = useState('');

  const turmaId = perfil?.turmaId ?? '';
  const { data: relatorio, isLoading } = useRelatoriosControllerFrequenciaTurmaDetalhada(
    turmaId,
    { materiaId: materiaId || undefined },
    { query: { enabled: !!turmaId } },
  );

  const detalhado = useMemo(() => relatorio?.detalhado ?? [], [relatorio]);

  const diasAgrupados = useMemo(() => {
    const porDia = new Map<
      string,
      { data: string; aulas: { materiaNome: string; status: string }[] }
    >();
    for (const linha of detalhado) {
      const chave = linha.data.slice(0, 10);
      const atual = porDia.get(chave) ?? { data: linha.data, aulas: [] };
      atual.aulas.push({ materiaNome: linha.materiaNome, status: linha.status });
      porDia.set(chave, atual);
    }
    return [...porDia.values()].sort((a, b) => (a.data < b.data ? 1 : -1));
  }, [detalhado]);

  const { pagina, setPagina, itensDaPagina: diasDaPagina } = usePaginacao(diasAgrupados);
  const [diaSelecionado, setDiaSelecionado] = useState<string | null>(null);
  const diaAberto = diasAgrupados.find((dia) => dia.data === diaSelecionado);

  if (perfil && !perfil.turmaId) {
    return (
      <>
        <Typography variant="h4" gutterBottom>
          Frequência
        </Typography>
        <Typography color="text.secondary">
          Você ainda não está matriculado em uma turma.
        </Typography>
      </>
    );
  }

  return (
    <>
      <Typography variant="h4" gutterBottom>
        Frequência
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Suas presenças e faltas por disciplina, até a data de hoje.
      </Typography>

      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <TextField
          select
          label="Disciplina"
          value={materiaId}
          onChange={(e) => setMateriaId(e.target.value)}
          sx={{ minWidth: 220 }}
        >
          <MenuItem value="">Todas as disciplinas</MenuItem>
          {(materias ?? []).map((m) => (
            <MenuItem key={m.id} value={m.id}>
              {m.nome}
            </MenuItem>
          ))}
        </TextField>
      </Paper>

      <Typography variant="subtitle1" gutterBottom>
        Resumo por disciplina
      </Typography>
      <Paper variant="outlined" sx={{ mb: 3, overflowX: 'auto' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Disciplina</TableCell>
              <TableCell>Frequência</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!isLoading &&
              (relatorio?.resumo ?? []).map((linha) => (
                <TableRow key={linha.materiaId}>
                  <TableCell>{linha.materiaNome}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={`${linha.frequenciaPercentual.toFixed(1)}%`}
                      color={linha.frequenciaPercentual < 75 ? 'error' : 'success'}
                    />
                  </TableCell>
                </TableRow>
              ))}
            {!isLoading && (relatorio?.resumo.length ?? 0) === 0 && (
              <TableRow>
                <TableCell colSpan={2}>
                  <Typography variant="body2" color="text.secondary">
                    Nenhuma aula lançada ainda.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      <Typography variant="subtitle1" gutterBottom>
        Detalhado por dia
      </Typography>
      <Paper variant="outlined" sx={{ overflowX: 'auto' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Data</TableCell>
              <TableCell>Aulas do dia</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!isLoading &&
              diasDaPagina.map((dia) => (
                <TableRow key={dia.data}>
                  <TableCell>{new Date(dia.data).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell>
                    <Button size="small" variant="outlined" onClick={() => setDiaSelecionado(dia.data)}>
                      Aulas
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            {!isLoading && diasAgrupados.length === 0 && (
              <TableRow>
                <TableCell colSpan={2}>
                  <Typography variant="body2" color="text.secondary">
                    Nenhuma aula lançada ainda.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <Paginacao total={diasAgrupados.length} pagina={pagina} onChange={setPagina} />
      </Paper>

      <Dialog open={!!diaSelecionado} onClose={() => setDiaSelecionado(null)} fullWidth maxWidth="xs">
        <DialogTitle>
          Aulas de {diaAberto && new Date(diaAberto.data).toLocaleDateString('pt-BR')}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={1}>
            {diaAberto?.aulas.map((aula, i) => (
              <Stack key={i} direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="body2">{aula.materiaNome}</Typography>
                <Chip
                  size="small"
                  label={LABEL_STATUS[aula.status].label}
                  color={LABEL_STATUS[aula.status].color}
                />
              </Stack>
            ))}
          </Stack>
        </DialogContent>
      </Dialog>
    </>
  );
}
