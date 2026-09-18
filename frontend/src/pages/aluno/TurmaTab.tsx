import { Avatar, Divider, Grid, List, ListItem, ListItemAvatar, ListItemText, Paper, Stack, Typography } from '@mui/material';
import { useAlunosControllerMeuPerfil, useAlunosControllerMinhaTurma } from '../../api/generated/alunos/alunos';
import { urlArquivo } from '../../api/arquivo-url';

export function TurmaTab() {
  const { data: perfil } = useAlunosControllerMeuPerfil();
  const { data: turmaDetalhe } = useAlunosControllerMinhaTurma();
  const turma = perfil?.turma;

  const fotoPorProfessorId = new Map(
    (turmaDetalhe?.professores ?? []).map((professor) => [professor.id, professor.fotoUrl]),
  );

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
        <>
          <Paper variant="outlined" sx={{ p: 3, maxWidth: 420, mb: 3 }}>
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

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="subtitle1" gutterBottom>
                Disciplinas
              </Typography>
              <Paper variant="outlined">
                <List dense>
                  {(turmaDetalhe?.disciplinas ?? []).map((disciplina, i) => (
                    <div key={disciplina.id}>
                      {i > 0 && <Divider component="li" />}
                      <ListItem>
                        <ListItemAvatar>
                          <Avatar
                            src={urlArquivo(fotoPorProfessorId.get(disciplina.professorId))}
                            sx={{ width: 32, height: 32 }}
                          />
                        </ListItemAvatar>
                        <ListItemText primary={disciplina.nome} secondary={disciplina.professorNome} />
                      </ListItem>
                    </div>
                  ))}
                  {!turmaDetalhe?.disciplinas.length && (
                    <ListItem>
                      <ListItemText
                        primary="Nenhuma disciplina cadastrada ainda."
                        slotProps={{ primary: { color: 'text.secondary' } }}
                      />
                    </ListItem>
                  )}
                </List>
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="subtitle1" gutterBottom>
                Alunos
              </Typography>
              <Paper variant="outlined">
                <List dense>
                  {(turmaDetalhe?.alunos ?? []).map((aluno, i) => (
                    <div key={aluno.id}>
                      {i > 0 && <Divider component="li" />}
                      <ListItem>
                        <ListItemAvatar>
                          <Avatar src={urlArquivo(aluno.fotoUrl)} sx={{ width: 32, height: 32 }} />
                        </ListItemAvatar>
                        <ListItemText primary={aluno.nome} secondary={aluno.matricula} />
                      </ListItem>
                    </div>
                  ))}
                  {!turmaDetalhe?.alunos.length && (
                    <ListItem>
                      <ListItemText
                        primary="Nenhum aluno vinculado ainda."
                        slotProps={{ primary: { color: 'text.secondary' } }}
                      />
                    </ListItem>
                  )}
                </List>
              </Paper>
            </Grid>
          </Grid>
        </>
      )}
    </>
  );
}
