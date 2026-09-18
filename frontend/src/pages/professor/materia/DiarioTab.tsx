import { useState } from 'react';
import { Chip, Paper, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { useMateriaAulasControllerFindAll } from '../../../api/generated/aulas/aulas';
import { usePaginacao } from '../../../components/usePaginacao';
import { Paginacao } from '../../../components/Paginacao';
import { AulaDialog } from './AulaDialog';

interface DiarioTabProps {
  materiaId: string;
}

export function DiarioTab({ materiaId }: DiarioTabProps) {
  const { data, isLoading } = useMateriaAulasControllerFindAll(materiaId);
  const [aulaSelecionada, setAulaSelecionada] = useState<string | null>(null);
  const aulas = data ?? [];
  const { pagina, setPagina, itensDaPagina } = usePaginacao(aulas);

  return (
    <>
      <Paper variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Data</TableCell>
              <TableCell>Título</TableCell>
              <TableCell>Estado</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!isLoading &&
              itensDaPagina.map((aula) => (
                <TableRow
                  key={aula.id}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => setAulaSelecionada(aula.id)}
                >
                  <TableCell>{new Date(aula.data).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell>{aula.titulo ?? '—'}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={aula.estado === 'LANCADO' ? 'Lançado' : 'Não lançado'}
                      color={aula.estado === 'LANCADO' ? 'success' : 'default'}
                    />
                  </TableCell>
                </TableRow>
              ))}
            {!isLoading && aulas.length === 0 && (
              <TableRow>
                <TableCell colSpan={3}>
                  <Typography color="text.secondary" variant="body2">
                    Nenhuma aula cadastrada para esta disciplina.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <Paginacao total={aulas.length} pagina={pagina} onChange={setPagina} />
      </Paper>

      <AulaDialog aulaId={aulaSelecionada} onClose={() => setAulaSelecionada(null)} />
    </>
  );
}
