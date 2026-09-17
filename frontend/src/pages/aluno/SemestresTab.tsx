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
              <TableCell>Matérias</TableCell>
              <TableCell>Aprovadas</TableCell>
              <TableCell>Reprovadas</TableCell>
              <TableCell>Cursando</TableCell>
              <TableCell></TableCell>
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
                  <TableCell>{item.totalMaterias}</TableCell>
                  <TableCell>{item.aprovadas}</TableCell>
                  <TableCell>{item.reprovadas}</TableCell>
                  <TableCell>{item.cursando}</TableCell>
                  <TableCell>
                    {item.atual && <Chip size="small" label="Atual" color="success" />}
                  </TableCell>
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
