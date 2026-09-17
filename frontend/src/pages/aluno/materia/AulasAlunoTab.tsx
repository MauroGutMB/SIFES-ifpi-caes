import { useState } from 'react';
import { Chip, Paper, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { useMateriaAulasControllerFindAll } from '../../../api/generated/aulas/aulas';
import { AulaMateriaisDialog } from './AulaMateriaisDialog';

interface AulasAlunoTabProps {
  materiaId: string;
}

export function AulasAlunoTab({ materiaId }: AulasAlunoTabProps) {
  const { data, isLoading } = useMateriaAulasControllerFindAll(materiaId);
  const [aulaSelecionada, setAulaSelecionada] = useState<string | null>(null);

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
              (data ?? []).map((aula) => (
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
            {!isLoading && !data?.length && (
              <TableRow>
                <TableCell colSpan={3}>
                  <Typography color="text.secondary" variant="body2">
                    Nenhuma aula cadastrada ainda.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      <AulaMateriaisDialog aulaId={aulaSelecionada} onClose={() => setAulaSelecionada(null)} />
    </>
  );
}
