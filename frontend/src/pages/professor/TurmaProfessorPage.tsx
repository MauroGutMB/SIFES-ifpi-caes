import { useMemo, useState } from 'react';
import {
  Box,
  Chip,
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
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useMateriasControllerFindAll } from '../../api/generated/materias/materias';
import { useRelatoriosControllerFrequenciaTurmaDetalhada } from '../../api/generated/relatorios/relatorios';
import { usePaginacao } from '../../components/usePaginacao';
import { Paginacao } from '../../components/Paginacao';

const LABEL_STATUS: Record<string, { label: string; color: 'success' | 'error' | 'default' }> = {
  PRESENTE: { label: 'Presente', color: 'success' },
  FALTA: { label: 'Falta', color: 'error' },
  FALTA_JUSTIFICADA: { label: 'Falta justificada', color: 'default' },
};

export function TurmaProfessorPage() {
  const { turmaId = '' } = useParams();
  const navigate = useNavigate();
  const { data: materias, isLoading } = useMateriasControllerFindAll();

  const [materiaId, setMateriaId] = useState('');
  const [alunoId, setAlunoId] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  const materiasDaTurma = (materias ?? []).filter((m) => m.turmaId === turmaId);

  const { data: relatorio, isLoading: carregandoRelatorio } =
    useRelatoriosControllerFrequenciaTurmaDetalhada(
      turmaId,
      {
        materiaId: materiaId || undefined,
        alunoId: alunoId || undefined,
        dataInicio: dataInicio || undefined,
        dataFim: dataFim || undefined,
      },
      { query: { enabled: !!turmaId } },
    );

  const resumo = relatorio?.resumo ?? [];
  const detalhado = relatorio?.detalhado ?? [];
  const paginacaoResumo = usePaginacao(resumo);
  const paginacaoDetalhado = usePaginacao(detalhado);

  const alunosDisponiveis = useMemo(() => {
    const mapa = new Map<string, string>();
    for (const linha of relatorio?.resumo ?? []) {
      mapa.set(linha.alunoId, `${linha.alunoNome} (${linha.matricula})`);
    }
    return [...mapa.entries()];
  }, [relatorio]);

  if (isLoading) return null;
  if (materiasDaTurma.length === 0) {
    return <Navigate to="/app/professor" replace />;
  }

  const turma = materiasDaTurma[0].turma;

  return (
    <>
      <Typography variant="h4" gutterBottom>
        {turma.cursoTecnico} — {turma.anoSerie}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Relatório de frequência das suas matérias nesta turma, até a data de hoje.
      </Typography>

      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', rowGap: 2 }}>
          <TextField
            select
            label="Matéria"
            value={materiaId}
            onChange={(e) => setMateriaId(e.target.value)}
            sx={{ minWidth: 200 }}
          >
            <MenuItem value="">Todas as minhas matérias</MenuItem>
            {materiasDaTurma.map((m) => (
              <MenuItem key={m.id} value={m.id}>
                {m.nome}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Aluno"
            value={alunoId}
            onChange={(e) => setAlunoId(e.target.value)}
            sx={{ minWidth: 220 }}
          >
            <MenuItem value="">Todos os alunos</MenuItem>
            {alunosDisponiveis.map(([id, label]) => (
              <MenuItem key={id} value={id}>
                {label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="De"
            type="date"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ minWidth: 160 }}
          />
          <TextField
            label="Até"
            type="date"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ minWidth: 160 }}
          />
        </Stack>
      </Paper>

      <Typography variant="subtitle1" gutterBottom>
        Resumo por aluno e matéria
      </Typography>
      <Paper variant="outlined" sx={{ mb: 3 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Aluno</TableCell>
              <TableCell>Matrícula</TableCell>
              <TableCell>Matéria</TableCell>
              <TableCell>Frequência</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!carregandoRelatorio &&
              paginacaoResumo.itensDaPagina.map((linha) => (
                <TableRow key={`${linha.materiaId}-${linha.alunoId}`}>
                  <TableCell>{linha.alunoNome}</TableCell>
                  <TableCell>{linha.matricula}</TableCell>
                  <TableCell>{linha.materiaNome}</TableCell>
                  <TableCell>
                    <Box
                      component="span"
                      sx={{ color: linha.frequenciaPercentual < 75 ? 'error.main' : undefined }}
                    >
                      {linha.frequenciaPercentual.toFixed(1)}%
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            {!carregandoRelatorio && resumo.length === 0 && (
              <TableRow>
                <TableCell colSpan={4}>
                  <Typography variant="body2" color="text.secondary">
                    Nenhum registro para os filtros selecionados.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <Paginacao
          total={resumo.length}
          pagina={paginacaoResumo.pagina}
          onChange={paginacaoResumo.setPagina}
        />
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
              <TableCell>Aluno</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!carregandoRelatorio &&
              paginacaoDetalhado.itensDaPagina.map((linha, i) => (
                <TableRow key={i}>
                  <TableCell>{new Date(linha.data).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell>{linha.materiaNome}</TableCell>
                  <TableCell>{linha.alunoNome}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={LABEL_STATUS[linha.status].label}
                      color={LABEL_STATUS[linha.status].color}
                    />
                  </TableCell>
                </TableRow>
              ))}
            {!carregandoRelatorio && detalhado.length === 0 && (
              <TableRow>
                <TableCell colSpan={4}>
                  <Typography variant="body2" color="text.secondary">
                    Nenhum registro para os filtros selecionados.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <Paginacao
          total={detalhado.length}
          pagina={paginacaoDetalhado.pagina}
          onChange={paginacaoDetalhado.setPagina}
        />
      </Paper>

      {materiasDaTurma.length > 0 && (
        <Stack direction="row" spacing={1} sx={{ mt: 3, flexWrap: 'wrap', rowGap: 1 }}>
          {materiasDaTurma.map((m) => (
            <Chip
              key={m.id}
              label={`Abrir ${m.nome}`}
              onClick={() => navigate(`/app/professor/materias/${m.id}`)}
              variant="outlined"
            />
          ))}
        </Stack>
      )}
    </>
  );
}
