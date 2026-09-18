import { useMemo, useState } from 'react';
import {
  Avatar,
  Box,
  Button,
  Chip,
  Collapse,
  Dialog,
  DialogContent,
  DialogTitle,
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
import { useMateriaPlanoControllerDetalhamentoAluno } from '../../api/generated/plano-disciplina/plano-disciplina';
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
  presentes: number;
  total: number;
}

function NotasDetalhadas({
  materiaId,
  alunoId,
  ativo,
}: {
  materiaId: string;
  alunoId: string;
  ativo: boolean;
}) {
  const { data: itens } = useMateriaPlanoControllerDetalhamentoAluno(materiaId, alunoId, {
    query: { enabled: ativo },
  });

  if (!itens?.length) {
    return (
      <Typography variant="caption" color="text.secondary">
        Nenhum item de avaliação lançado.
      </Typography>
    );
  }

  return (
    <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 0.5 }}>
      {itens.map((item) => (
        <Chip
          key={item.id}
          size="small"
          variant="outlined"
          label={`${item.nome}: ${item.valorObtido}/${item.valorMaximo}`}
        />
      ))}
    </Stack>
  );
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
                Detalhamento por disciplina
              </Typography>
              <Table size="small">
                <TableBody>
                  {aluno.materias.map((m) => (
                    <TableRow key={m.materiaId}>
                      <TableCell sx={{ border: 0, verticalAlign: 'top' }} width={140}>
                        {m.materiaNome}
                      </TableCell>
                      <TableCell sx={{ border: 0, verticalAlign: 'top' }}>
                        <NotasDetalhadas
                          materiaId={m.materiaId}
                          alunoId={aluno.alunoId}
                          ativo={aberto}
                        />
                      </TableCell>
                      <TableCell sx={{ border: 0, verticalAlign: 'top' }} width={100}>
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

interface DetalheDisciplinaDialogProps {
  materiaId: string | null;
  materiaNome: string | undefined;
  aulas: AulaAgrupada[];
  onClose: () => void;
  onAbrirAula: (aulaId: string) => void;
}

function DetalheDisciplinaDialog({
  materiaId,
  materiaNome,
  aulas,
  onClose,
  onAbrirAula,
}: DetalheDisciplinaDialogProps) {
  return (
    <Dialog open={!!materiaId} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{materiaNome} — aulas</DialogTitle>
      <DialogContent>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Data</TableCell>
              <TableCell>Presenças</TableCell>
              <TableCell width={160} />
            </TableRow>
          </TableHead>
          <TableBody>
            {aulas.map((aula) => (
              <TableRow key={aula.aulaId}>
                <TableCell>{new Date(aula.data).toLocaleDateString('pt-BR')}</TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={`${aula.presentes}/${aula.total}`}
                    color={aula.presentes === aula.total ? 'success' : 'default'}
                  />
                </TableCell>
                <TableCell>
                  <Button size="small" variant="outlined" onClick={() => onAbrirAula(aula.aulaId)}>
                    Abrir aula detalhada
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {aulas.length === 0 && (
              <TableRow>
                <TableCell colSpan={3}>
                  <Typography variant="body2" color="text.secondary">
                    Nenhum registro para os filtros selecionados.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </DialogContent>
    </Dialog>
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
  const [materiaDetalheId, setMateriaDetalheId] = useState<string | null>(null);

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

  const aulasPorMateria = useMemo(() => {
    const porMateria = new Map<string, Map<string, AulaAgrupada>>();
    for (const linha of detalhado) {
      const porAula = porMateria.get(linha.materiaId) ?? new Map<string, AulaAgrupada>();
      const atual = porAula.get(linha.aulaId) ?? {
        aulaId: linha.aulaId,
        data: linha.data,
        presentes: 0,
        total: 0,
      };
      atual.total += 1;
      if (linha.status === 'PRESENTE') atual.presentes += 1;
      porAula.set(linha.aulaId, atual);
      porMateria.set(linha.materiaId, porAula);
    }
    return porMateria;
  }, [detalhado]);

  const paginacaoAlunos = usePaginacao(alunosAgrupados);
  const aulasDaMateriaDetalhada = [...(aulasPorMateria.get(materiaDetalheId ?? '')?.values() ?? [])];

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
        Relatório de frequência das suas disciplinas nesta turma, até a data de hoje.
      </Typography>

      <Typography variant="subtitle1" gutterBottom>
        Minhas disciplinas nesta turma
      </Typography>
      <Stack direction="row" spacing={1} sx={{ mb: 3, flexWrap: 'wrap', rowGap: 1 }}>
        {materiasDaTurma.map((m) => (
          <Chip
            key={m.id}
            label={m.nome}
            onClick={() => navigate(`/app/professor/materias/${m.id}`)}
            variant="outlined"
          />
        ))}
      </Stack>

      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', rowGap: 2 }}>
          <TextField
            select
            label="Disciplina"
            value={materiaId}
            onChange={(e) => setMateriaId(e.target.value)}
            sx={{ minWidth: 200 }}
          >
            <MenuItem value="">Todas as minhas disciplinas</MenuItem>
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
              <TableCell>Disciplinas</TableCell>
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
        Detalhado por disciplina
      </Typography>
      <Paper variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Disciplina</TableCell>
              <TableCell>Aulas registradas</TableCell>
              <TableCell width={160} />
            </TableRow>
          </TableHead>
          <TableBody>
            {!carregandoRelatorio &&
              materiasDaTurma.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>{m.nome}</TableCell>
                  <TableCell>{aulasPorMateria.get(m.id)?.size ?? 0}</TableCell>
                  <TableCell>
                    <Button size="small" variant="outlined" onClick={() => setMateriaDetalheId(m.id)}>
                      Abrir
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </Paper>

      <DetalheDisciplinaDialog
        materiaId={materiaDetalheId}
        materiaNome={materiasDaTurma.find((m) => m.id === materiaDetalheId)?.nome}
        aulas={aulasDaMateriaDetalhada}
        onClose={() => setMateriaDetalheId(null)}
        onAbrirAula={setAulaSelecionada}
      />
      <AulaDialog aulaId={aulaSelecionada} onClose={() => setAulaSelecionada(null)} />
    </>
  );
}
