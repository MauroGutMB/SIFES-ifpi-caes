import { Paper, Stack, Typography } from '@mui/material';
import { useAlunosControllerMeuPerfil } from '../../api/generated/alunos/alunos';

export function TurmaTab() {
  const { data: perfil } = useAlunosControllerMeuPerfil();
  const turma = perfil?.turma;

  return (
    <>
      <Typography variant="h4" gutterBottom>
        Turma
      </Typography>

      {!turma ? (
        <Typography color="text.secondary">
          Você ainda não está matriculado em nenhuma turma.
        </Typography>
      ) : (
        <Paper variant="outlined" sx={{ p: 3, maxWidth: 420 }}>
          <Stack spacing={1.5}>
            <div>
              <Typography variant="body2" color="text.secondary">
                Curso técnico
              </Typography>
              <Typography variant="body1">{turma.cursoTecnico}</Typography>
            </div>
            <div>
              <Typography variant="body2" color="text.secondary">
                Ano/Série
              </Typography>
              <Typography variant="body1">{turma.anoSerie}</Typography>
            </div>
            <div>
              <Typography variant="body2" color="text.secondary">
                Turno
              </Typography>
              <Typography variant="body1">
                {turma.turno === 'MANHA' ? 'Manhã' : 'Tarde'}
              </Typography>
            </div>
            <div>
              <Typography variant="body2" color="text.secondary">
                Semestre
              </Typography>
              <Typography variant="body1">{turma.semestre.nome}</Typography>
            </div>
          </Stack>
        </Paper>
      )}
    </>
  );
}
