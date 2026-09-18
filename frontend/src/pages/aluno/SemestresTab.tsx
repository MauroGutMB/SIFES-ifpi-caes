import { Chip, Paper, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { useAlunosControllerMeusSemestres } from '../../api/generated/alunos/alunos';
import type { MeuSemestreDto } from '../../api/generated/models';

export function SemestresTab() {
  const { data, isLoading } = useAlunosControllerMeusSemestres();

  return (
    <>
      <Typography variant="h4" gutterBottom>
        Meus semestres
      </Typography>

      <Paper variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Semestre</TableCell>
              <TableCell>Turma</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Disciplinas</TableCell>
              <TableCell>Aprovadas</TableCell>
              <TableCell>Reprovadas</TableCell>
              <TableCell>Cursando</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!isLoading &&
              (data ?? []).map((item: MeuSemestreDto) => (
                <TableRow key={item.semestre.id}>
                  <TableCell>{item.semestre.nome}</TableCell>
                  <TableCell>
                    {item.turma.cursoTecnico} — {item.turma.anoSerie}
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={item.atual ? 'Cursando' : 'Concluído'}
                      color={item.atual ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell>{item.totalMaterias}</TableCell>
                  <TableCell>{item.aprovadas}</TableCell>
                  <TableCell>{item.reprovadas}</TableCell>
                  <TableCell>{item.cursando}</TableCell>
                </TableRow>
              ))}
            {!isLoading && !data?.length && (
              <TableRow>
                <TableCell colSpan={7}>
                  <Typography color="text.secondary" variant="body2">
                    Nenhum semestre cursado ainda.
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
