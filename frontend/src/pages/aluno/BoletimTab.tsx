import { useState } from 'react';
import {
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
import { useQueries } from '@tanstack/react-query';
import { baixarArquivo } from '../../api/download';
import { useAlunosControllerMeuPerfil } from '../../api/generated/alunos/alunos';
import { useMateriasControllerFindAll } from '../../api/generated/materias/materias';
import {
  getMateriaPlanoControllerBoletimQueryKey,
  materiaPlanoControllerBoletim,
} from '../../api/generated/plano-disciplina/plano-disciplina';

const LABEL_SITUACAO: Record<string, { label: string; color: 'default' | 'success' | 'error' }> = {
  CURSANDO: { label: 'Cursando', color: 'default' },
  APROVADO: { label: 'Aprovado', color: 'success' },
  REPROVADO: { label: 'Reprovado', color: 'error' },
};

export function BoletimTab() {
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
      <Typography variant="h4" gutterBottom>
        Boletim
      </Typography>

      <Paper variant="outlined" sx={{ mb: 3 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Matéria</TableCell>
              <TableCell>Média</TableCell>
              <TableCell>Frequência</TableCell>
              <TableCell>Situação</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(materias ?? []).map((materia, i) => {
              const linha = resultados[i]?.data?.[0];
              return (
                <TableRow key={materia.id}>
                  <TableCell>{materia.nome}</TableCell>
                  <TableCell>{linha ? linha.notaFinal.toFixed(1) : '—'}</TableCell>
                  <TableCell>
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
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Paper>

      {perfil && (
        <>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Para o detalhamento por item de cada matéria, acesse a matéria em "Minhas matérias".
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
        </>
      )}
    </>
  );
}
