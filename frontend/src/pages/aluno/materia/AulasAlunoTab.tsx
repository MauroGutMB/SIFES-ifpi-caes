import { useState } from 'react';
import { Button, Paper, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { useMateriaAulasControllerFindAll } from '../../../api/generated/aulas/aulas';
import { usePaginacao } from '../../../components/usePaginacao';
import { Paginacao } from '../../../components/Paginacao';
import { AulaMateriaisDialog } from './AulaMateriaisDialog';

interface AulasAlunoTabProps {
  materiaId: string;
}

export function AulasAlunoTab({ materiaId }: AulasAlunoTabProps) {
  const { data, isLoading } = useMateriaAulasControllerFindAll(materiaId);
  const [aulaSelecionada, setAulaSelecionada] = useState<string | null>(null);
  const aulas = data ?? [];
  const { pagina, setPagina, itensDaPagina } = usePaginacao(aulas);

  return (
    <>
      <Paper variant="outlined" sx={{ overflowX: 'auto' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Data</TableCell>
              <TableCell>Título</TableCell>
              <TableCell>Materiais de aula</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!isLoading &&
              itensDaPagina.map((aula) => (
                <TableRow key={aula.id}>
                  <TableCell>{new Date(aula.data).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell>{aula.titulo ?? '—'}</TableCell>
                  <TableCell>
                    <Button size="small" onClick={() => setAulaSelecionada(aula.id)}>
                      Abrir
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            {!isLoading && aulas.length === 0 && (
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
        <Paginacao total={aulas.length} pagina={pagina} onChange={setPagina} />
      </Paper>

      <AulaMateriaisDialog aulaId={aulaSelecionada} onClose={() => setAulaSelecionada(null)} />
    </>
  );
}
