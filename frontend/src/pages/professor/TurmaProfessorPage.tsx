import { useMemo, useState } from 'react';
import {
  Avatar,
  Box,
  Button,
  Chip,
  Collapse,
  IconButton,
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
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useMateriasControllerFindAll } from '../../api/generated/materias/materias';
import { useRelatoriosControllerFrequenciaTurmaDetalhada } from '../../api/generated/relatorios/relatorios';
import { usePaginacao } from '../../components/usePaginacao';
import { Paginacao } from '../../components/Paginacao';
import { AulaDialog } from './materia/AulaDialog';

interface AlunoAgrupado {
  alunoId: string;
  alunoNome: string;
  matricula: string;
  fotoUrl: string | null;
  materias: { materiaId: string; materiaNome: string; frequenciaPercentual: number }[];
}

interface AulaAgrupada {
  aulaId: string;
  data: string;
  materiaNome: string;
  presentes: number;
  total: number;
}

function LinhaAluno({ aluno }: { aluno: AlunoAgrupado }) {
  const [aberto, setAberto] = useState(false);
  return (
    <>
      <TableRow hover sx={{ cursor: 'pointer' }} onClick={() => setAberto((v) => !v)}>
        <TableCell width={40}>
          <IconButton size="small">
            {aberto ? <KeyboardArrowUpIcon fontSize="small" /> : <KeyboardArrowDownIcon fontSize="small" />}
          </IconButton>
        </TableCell>
        <TableCell>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Avatar src={aluno.fotoUrl ?? undefined} sx={{ width: 28, height: 28 }} />
            <span>{aluno.alunoNome}</span>
          </Stack>
        </TableCell>
        <TableCell>{aluno.matricula}</TableCell>
        <TableCell>{aluno.materias.length}</TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={4} sx={{ py: 0, borderBottom: aberto ? undefined : 'none' }}>
          <Collapse in={aberto} unmountOnExit>
            <Box sx={{ py: 1.5, pl: 5 }}>
              <Typography variant="caption" color="text.secondary">
                Detalhamento por matéria
              </Typography>
              <Table size="small">
                <TableBody>
                  {aluno.materias.map((m) => (
                    <TableRow key={m.materiaId}>
                      <TableCell sx={{ border: 0 }}>{m.materiaNome}</TableCell>
                      <TableCell sx={{ border: 0 }} width={100}>
                        <Box
                          component="span"
                          sx={{ color: m.frequenciaPercentual < 75 ? 'error.main' : undefined }}
                        >
                          {m.frequenciaPercentual.toFixed(1)}%
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

export function TurmaProfessorPage() {
  const { turmaId = '' } = useParams();
  const navigate = useNavigate();
  const { data: materias, isLoading } = useMateriasControllerFindAll();

  const [materiaId, setMateriaId] = useState('');
  const [alunoId, setAlunoId] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [aulaSelecionada, setAulaSelecionada] = useState<string | null>(null);

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

  const resumo = useMemo(() => relatorio?.resumo ?? [], [relatorio]);
  const detalhado = useMemo(() => relatorio?.detalhado ?? [], [relatorio]);

  const alunosAgrupados = useMemo<AlunoAgrupado[]>(() => {
    const porAluno = new Map<string, AlunoAgrupado>();
    for (const linha of resumo) {
      const atual = porAluno.get(linha.alunoId) ?? {
        alunoId: linha.alunoId,
        alunoNome: linha.alunoNome,
        matricula: linha.matricula,
        fotoUrl: linha.fotoUrl,
        materias: [],
      };
      atual.materias.push({
        materiaId: linha.materiaId,
        materiaNome: linha.materiaNome,
        frequenciaPercentual: linha.frequenciaPercentual,
      });
      porAluno.set(linha.alunoId, atual);
    }
    return [...porAluno.values()];
  }, [resumo]);

  const aulasAgrupadas = useMemo<AulaAgrupada[]>(() => {
    const porAula = new Map<string, AulaAgrupada>();
    for (const linha of detalhado) {
      const atual = porAula.get(linha.aulaId) ?? {
        aulaId: linha.aulaId,
        data: linha.data,
        materiaNome: linha.materiaNome,
        presentes: 0,
        total: 0,
      };
      atual.total += 1;
      if (linha.status === 'PRESENTE') atual.presentes += 1;
      porAula.set(linha.aulaId, atual);
    }
    return [...porAula.values()];
  }, [detalhado]);

  const paginacaoAlunos = usePaginacao(alunosAgrupados);
  const paginacaoAulas = usePaginacao(aulasAgrupadas);

  const alunosDisponiveis = useMemo(() => {
    const mapa = new Map<string, string>();
    for (const linha of resumo) {
      mapa.set(linha.alunoId, `${linha.alunoNome} (${linha.matricula})`);
    }
    return [...mapa.entries()];
  }, [resumo]);

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
        Resumo por aluno
      </Typography>
      <Paper variant="outlined" sx={{ mb: 3 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell width={40} />
              <TableCell>Aluno</TableCell>
              <TableCell>Matrícula</TableCell>
              <TableCell>Matérias</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!carregandoRelatorio &&
              paginacaoAlunos.itensDaPagina.map((aluno) => (
                <LinhaAluno key={aluno.alunoId} aluno={aluno} />
              ))}
            {!carregandoRelatorio && alunosAgrupados.length === 0 && (
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
          total={alunosAgrupados.length}
          pagina={paginacaoAlunos.pagina}
          onChange={paginacaoAlunos.setPagina}
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
              <TableCell>Presenças</TableCell>
              <TableCell width={160} />
            </TableRow>
          </TableHead>
          <TableBody>
            {!carregandoRelatorio &&
              paginacaoAulas.itensDaPagina.map((aula) => (
                <TableRow key={aula.aulaId}>
                  <TableCell>{new Date(aula.data).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell>{aula.materiaNome}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={`${aula.presentes}/${aula.total}`}
                      color={aula.presentes === aula.total ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell>
                    <Button size="small" variant="outlined" onClick={() => setAulaSelecionada(aula.aulaId)}>
                      Abrir aula detalhada
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            {!carregandoRelatorio && aulasAgrupadas.length === 0 && (
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
          total={aulasAgrupadas.length}
          pagina={paginacaoAulas.pagina}
          onChange={paginacaoAulas.setPagina}
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

      <AulaDialog aulaId={aulaSelecionada} onClose={() => setAulaSelecionada(null)} />
    </>
  );
}
