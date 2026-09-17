import { Chip, Grid, List, ListItemButton, ListItemText, Paper, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAlunosControllerMeuPerfil, useAlunosControllerResumoAtividades } from '../../api/generated/alunos/alunos';
import { useMateriasControllerFindAll } from '../../api/generated/materias/materias';
import { useRelatoriosControllerFrequenciaTurmaDetalhada } from '../../api/generated/relatorios/relatorios';

export function MinhaSituacaoPage() {
  const navigate = useNavigate();
  const { data: perfil } = useAlunosControllerMeuPerfil();
  const { data: materias } = useMateriasControllerFindAll();
  const { data: atividadesResumo } = useAlunosControllerResumoAtividades();

  const turmaId = perfil?.turmaId ?? '';
  const { data: frequencia } = useRelatoriosControllerFrequenciaTurmaDetalhada(turmaId, undefined, {
    query: { enabled: !!turmaId },
  });

  const irParaMateria = (materiaId: string) => navigate(`/app/aluno/materias/${materiaId}`);

  return (
    <>
      <Typography variant="h4" gutterBottom>
        Minha situação
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Um resumo de presença, atividades e das matérias que você cursa.
      </Typography>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Typography variant="subtitle1" gutterBottom>
            Presença por matéria
          </Typography>
          <Paper variant="outlined">
            <List dense disablePadding>
              {(frequencia?.resumo ?? []).map((linha) => (
                <ListItemButton key={linha.materiaId} onClick={() => irParaMateria(linha.materiaId)}>
                  <ListItemText primary={linha.materiaNome} />
                  <Chip
                    size="small"
                    label={`${linha.frequenciaPercentual.toFixed(0)}%`}
                    color={linha.frequenciaPercentual < 75 ? 'error' : 'success'}
                  />
                </ListItemButton>
              ))}
              {!frequencia?.resumo.length && (
                <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                  Nenhuma aula lançada ainda.
                </Typography>
              )}
            </List>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Typography variant="subtitle1" gutterBottom>
            Atividades
          </Typography>
          <Paper variant="outlined">
            <List dense disablePadding>
              {(atividadesResumo ?? []).map((linha) => (
                <ListItemButton key={linha.materiaId} onClick={() => irParaMateria(linha.materiaId)}>
                  <ListItemText primary={linha.materiaNome} />
                  <Stack direction="row" spacing={0.5}>
                    {linha.concluidas > 0 && (
                      <Chip size="small" label={linha.concluidas} color="success" />
                    )}
                    {linha.pendentes > 0 && (
                      <Chip size="small" label={linha.pendentes} color="warning" />
                    )}
                    {linha.vencidas > 0 && <Chip size="small" label={linha.vencidas} color="error" />}
                    {linha.total === 0 && (
                      <Typography variant="caption" color="text.secondary">
                        —
                      </Typography>
                    )}
                  </Stack>
                </ListItemButton>
              ))}
              {!atividadesResumo?.length && (
                <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                  Nenhuma matéria vinculada ainda.
                </Typography>
              )}
            </List>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Typography variant="subtitle1" gutterBottom>
            Minhas disciplinas
          </Typography>
          <Paper variant="outlined">
            <List dense disablePadding>
              {(materias ?? []).map((materia) => (
                <ListItemButton key={materia.id} onClick={() => irParaMateria(materia.id)}>
                  <ListItemText primary={materia.nome} secondary={materia.professor.nome} />
                </ListItemButton>
              ))}
              {!materias?.length && (
                <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                  Nenhuma matéria vinculada ainda.
                </Typography>
              )}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </>
  );
}
