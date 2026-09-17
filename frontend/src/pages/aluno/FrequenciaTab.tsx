import { useState } from 'react';
import {
  Chip,
  MenuItem,
  Paper,
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
        Suas presenças e faltas por matéria, até a data de hoje.
      </Typography>

      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <TextField
          select
          label="Matéria"
          value={materiaId}
          onChange={(e) => setMateriaId(e.target.value)}
          sx={{ minWidth: 220 }}
        >
          <MenuItem value="">Todas as matérias</MenuItem>
          {(materias ?? []).map((m) => (
            <MenuItem key={m.id} value={m.id}>
              {m.nome}
            </MenuItem>
          ))}
        </TextField>
      </Paper>

      <Typography variant="subtitle1" gutterBottom>
        Resumo por matéria
      </Typography>
      <Paper variant="outlined" sx={{ mb: 3 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Matéria</TableCell>
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
        Detalhado por aula
      </Typography>
      <Paper variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Data</TableCell>
              <TableCell>Matéria</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!isLoading &&
              (relatorio?.detalhado ?? []).map((linha, i) => (
                <TableRow key={i}>
                  <TableCell>{new Date(linha.data).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell>{linha.materiaNome}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={LABEL_STATUS[linha.status].label}
                      color={LABEL_STATUS[linha.status].color}
                    />
                  </TableCell>
                </TableRow>
              ))}
            {!isLoading && (relatorio?.detalhado.length ?? 0) === 0 && (
              <TableRow>
                <TableCell colSpan={3}>
                  <Typography variant="body2" color="text.secondary">
                    Nenhuma aula lançada ainda.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>
    </>
  );
}
