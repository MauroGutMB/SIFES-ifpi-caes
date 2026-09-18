import { useState } from 'react';
import {
  Box,
  Button,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
  Typography,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/DownloadOutlined';
import AssessmentIcon from '@mui/icons-material/AssessmentOutlined';
import ChevronRightIcon from '@mui/icons-material/ChevronRightOutlined';
import InboxIcon from '@mui/icons-material/InboxOutlined';
import { useNavigate } from 'react-router-dom';
import { useQueries } from '@tanstack/react-query';
import { baixarArquivo } from '../../api/download';
import { useAlunosControllerMeuPerfil } from '../../api/generated/alunos/alunos';
import { useMateriasControllerFindAll } from '../../api/generated/materias/materias';
import {
  getMateriaPlanoControllerBoletimQueryKey,
  materiaPlanoControllerBoletim,
} from '../../api/generated/plano-disciplina/plano-disciplina';
import { tokens } from '../../theme/tokens';
import { corMedia } from '../../utils/corMedia';

const LABEL_SITUACAO: Record<string, { label: string; color: 'default' | 'success' | 'error' }> = {
  CURSANDO: { label: 'Cursando', color: 'default' },
  APROVADO: { label: 'Aprovado', color: 'success' },
  REPROVADO: { label: 'Reprovado', color: 'error' },
};

const FREQUENCIA_MINIMA = 75;

export function BoletimTab() {
  const navigate = useNavigate();
  const { data: perfil } = useAlunosControllerMeuPerfil();
  const { data: materias } = useMateriasControllerFindAll();
  const [baixando, setBaixando] = useState<string | null>(null);

  const resultados = useQueries({
    queries: (materias ?? []).map((materia) => ({
      queryKey: getMateriaPlanoControllerBoletimQueryKey(materia.id),
      queryFn: () => materiaPlanoControllerBoletim(materia.id),
      enabled: !!materias,
    })),
  });

  const baixarComEstado = async (chave: string, url: string, nomeArquivo: string) => {
    setBaixando(chave);
    try {
      await baixarArquivo(url, nomeArquivo);
    } finally {
      setBaixando(null);
    }
  };

  return (
    <>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 0.5 }}>
        <AssessmentIcon color="primary" />
        <Typography variant="h4">Boletim</Typography>
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Toque em uma disciplina para ver o detalhamento nota a nota.
      </Typography>

      <Paper variant="outlined" sx={{ mb: 3, overflowX: 'auto' }}>
        {materias?.length ? (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Disciplina</TableCell>
                <TableCell>Média</TableCell>
                <TableCell>Frequência</TableCell>
                <TableCell>Situação</TableCell>
                <TableCell width={40} />
              </TableRow>
            </TableHead>
            <TableBody>
              {materias.map((materia, i) => {
                const linha = resultados[i]?.data?.[0];
                const frequenciaBaixa = !!linha && linha.frequenciaPercentual < FREQUENCIA_MINIMA;
                return (
                  <TableRow
                    key={materia.id}
                    hover
                    onClick={() => navigate(`/app/aluno/materias/${materia.id}`)}
                  >
                    <TableCell>{materia.nome}</TableCell>
                    <TableCell
                      sx={
                        linha
                          ? {
                              color: corMedia(
                                linha.notaFinal,
                                linha.notaParcial,
                                Number(materia.notaMinimaAprovacao),
                              ),
                              fontWeight: 600,
                            }
                          : undefined
                      }
                    >
                      {linha ? linha.notaFinal.toFixed(1) : '—'}
                    </TableCell>
                    <TableCell sx={{ color: frequenciaBaixa ? tokens.redText : undefined, fontWeight: frequenciaBaixa ? 600 : undefined }}>
                      {linha ? `${linha.frequenciaPercentual.toFixed(0)}%` : '—'}
                    </TableCell>
                    <TableCell>
                      {linha && (
                        <Chip
                          size="small"
                          label={LABEL_SITUACAO[linha.situacao].label}
                          color={LABEL_SITUACAO[linha.situacao].color}
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      <ChevronRightIcon fontSize="small" sx={{ color: 'text.disabled' }} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <Stack spacing={1} sx={{ alignItems: 'center', py: 4, color: tokens.textSecondary }}>
            <InboxIcon fontSize="small" />
            <Typography variant="body2" color="text.secondary">
              Você ainda não está vinculado a nenhuma disciplina.
            </Typography>
          </Stack>
        )}
      </Paper>

      {perfil && (
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Baixe o boletim completo do semestre atual:
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              disabled={baixando === 'pdf'}
              onClick={() =>
                baixarComEstado(
                  'pdf',
                  `/relatorios/boletim/${perfil.id}?formato=pdf`,
                  'boletim.pdf',
                )
              }
            >
              PDF
            </Button>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              disabled={baixando === 'xlsx'}
              onClick={() =>
                baixarComEstado(
                  'xlsx',
                  `/relatorios/boletim/${perfil.id}?formato=xlsx`,
                  'boletim.xlsx',
                )
              }
            >
              Excel
            </Button>
          </Stack>
        </Box>
      )}
    </>
  );
}
