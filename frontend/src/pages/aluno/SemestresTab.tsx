import { useState } from 'react';
import { Button, Chip, Paper, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import DownloadIcon from '@mui/icons-material/DownloadOutlined';
import { useAlunosControllerMeuPerfil, useAlunosControllerMeusSemestres } from '../../api/generated/alunos/alunos';
import type { MeuSemestreDto } from '../../api/generated/models';
import { baixarArquivo } from '../../api/download';
import { useToast } from '../../components/ToastProvider';

export function SemestresTab() {
  const toast = useToast();
  const { data: perfil } = useAlunosControllerMeuPerfil();
  const { data, isLoading } = useAlunosControllerMeusSemestres();
  const [baixando, setBaixando] = useState<string | null>(null);

  const baixarBoletim = async (semestreId: string) => {
    if (!perfil) return;
    setBaixando(semestreId);
    try {
      await baixarArquivo(
        `/relatorios/boletim/${perfil.id}?formato=pdf&semestreId=${semestreId}`,
        'boletim.pdf',
      );
    } catch {
      toast.error('Não foi possível exportar o boletim');
    } finally {
      setBaixando(null);
    }
  };

  return (
    <>
      <Typography variant="h4" gutterBottom>
        Meus semestres
      </Typography>

      <Paper variant="outlined" sx={{ overflowX: 'auto' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Semestre</TableCell>
              <TableCell>Turma</TableCell>
              <TableCell>Disciplinas</TableCell>
              <TableCell>Aprovadas</TableCell>
              <TableCell>Reprovadas</TableCell>
              <TableCell>Cursando</TableCell>
              <TableCell>Boletim</TableCell>
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
                  <TableCell>
                    <Chip
                      size="small"
                      label={item.atual ? 'Cursando' : 'Concluído'}
                      color={item.atual ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<DownloadIcon />}
                      disabled={baixando === item.semestre.id}
                      onClick={() => baixarBoletim(item.semestre.id)}
                    >
                      PDF
                    </Button>
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
