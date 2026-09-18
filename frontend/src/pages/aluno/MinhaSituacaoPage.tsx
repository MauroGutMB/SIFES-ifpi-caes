import type { ReactNode } from 'react';
import {
  Box,
  Chip,
  Divider,
  Grid,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import EventAvailableIcon from '@mui/icons-material/EventAvailableOutlined';
import AssignmentIcon from '@mui/icons-material/AssignmentOutlined';
import MenuBookIcon from '@mui/icons-material/MenuBookOutlined';
import ChevronRightIcon from '@mui/icons-material/ChevronRightOutlined';
import InboxIcon from '@mui/icons-material/InboxOutlined';
import { useNavigate } from 'react-router-dom';
import { useAlunosControllerMeuPerfil, useAlunosControllerResumoAtividades } from '../../api/generated/alunos/alunos';
import { useMateriasControllerFindAll } from '../../api/generated/materias/materias';
import { useRelatoriosControllerFrequenciaTurmaDetalhada } from '../../api/generated/relatorios/relatorios';
import { tokens } from '../../theme/tokens';

function EstadoVazio({ mensagem }: { mensagem: string }) {
  return (
    <Stack spacing={1} sx={{ alignItems: 'center', py: 4, px: 2, color: tokens.textSecondary }}>
      <InboxIcon fontSize="small" />
      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
        {mensagem}
      </Typography>
    </Stack>
  );
}

function TituloBox({ icone, texto }: { icone: ReactNode; texto: string }) {
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
      <Box sx={{ color: 'primary.main', display: 'flex' }}>{icone}</Box>
      <Typography variant="subtitle1">{texto}</Typography>
    </Stack>
  );
}

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
        Um resumo de presença, atividades e das disciplinas que você cursa. Toque em qualquer
        linha para abrir a disciplina.
      </Typography>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <TituloBox icone={<EventAvailableIcon fontSize="small" />} texto="Presença por disciplina" />
          <Paper variant="outlined">
            {frequencia?.resumo.length ? (
              <List dense disablePadding>
                {frequencia.resumo.map((linha, i) => (
                  <Box key={linha.materiaId}>
                    {i > 0 && <Divider component="li" />}
                    <ListItemButton onClick={() => irParaMateria(linha.materiaId)}>
                      <ListItemText primary={linha.materiaNome} />
                      <Chip
                        size="small"
                        label={`${linha.frequenciaPercentual.toFixed(0)}%`}
                        color={linha.frequenciaPercentual < 75 ? 'error' : 'success'}
                        sx={{ mr: 0.5 }}
                      />
                      <ChevronRightIcon fontSize="small" sx={{ color: 'text.disabled' }} />
                    </ListItemButton>
                  </Box>
                ))}
              </List>
            ) : (
              <EstadoVazio mensagem="Nenhuma aula lançada ainda." />
            )}
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <TituloBox icone={<AssignmentIcon fontSize="small" />} texto="Atividades" />
          <Paper variant="outlined">
            {atividadesResumo?.length ? (
              <>
                <Stack
                  direction="row"
                  spacing={2}
                  sx={{ px: 2, py: 1, borderBottom: 1, borderColor: 'divider', flexWrap: 'wrap', rowGap: 0.5 }}
                >
                  <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'success.main' }} />
                    <Typography variant="caption" color="text.secondary">
                      concluída
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'warning.main' }} />
                    <Typography variant="caption" color="text.secondary">
                      pendente
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'error.main' }} />
                    <Typography variant="caption" color="text.secondary">
                      vencida
                    </Typography>
                  </Stack>
                </Stack>
                <List dense disablePadding>
                  {atividadesResumo.map((linha, i) => (
                    <Box key={linha.materiaId}>
                      {i > 0 && <Divider component="li" />}
                      <ListItemButton onClick={() => irParaMateria(linha.materiaId)}>
                        <ListItemText primary={linha.materiaNome} />
                        <Stack direction="row" spacing={0.5} sx={{ mr: 0.5 }}>
                          {linha.concluidas > 0 && (
                            <Tooltip title={`${linha.concluidas} concluída(s)`}>
                              <Chip size="small" label={linha.concluidas} color="success" />
                            </Tooltip>
                          )}
                          {linha.pendentes > 0 && (
                            <Tooltip title={`${linha.pendentes} pendente(s)`}>
                              <Chip size="small" label={linha.pendentes} color="warning" />
                            </Tooltip>
                          )}
                          {linha.vencidas > 0 && (
                            <Tooltip title={`${linha.vencidas} vencida(s)`}>
                              <Chip size="small" label={linha.vencidas} color="error" />
                            </Tooltip>
                          )}
                          {linha.total === 0 && (
                            <Typography variant="caption" color="text.secondary">
                              sem atividades
                            </Typography>
                          )}
                        </Stack>
                        <ChevronRightIcon fontSize="small" sx={{ color: 'text.disabled' }} />
                      </ListItemButton>
                    </Box>
                  ))}
                </List>
              </>
            ) : (
              <EstadoVazio mensagem="Nenhuma disciplina vinculada ainda." />
            )}
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <TituloBox icone={<MenuBookIcon fontSize="small" />} texto="Minhas disciplinas" />
          <Paper variant="outlined">
            {materias?.length ? (
              <List dense disablePadding>
                {materias.map((materia, i) => (
                  <Box key={materia.id}>
                    {i > 0 && <Divider component="li" />}
                    <ListItemButton onClick={() => irParaMateria(materia.id)}>
                      <ListItemText primary={materia.nome} secondary={materia.professor.nome} />
                      <ChevronRightIcon fontSize="small" sx={{ color: 'text.disabled' }} />
                    </ListItemButton>
                  </Box>
                ))}
              </List>
            ) : (
              <EstadoVazio mensagem="Nenhuma disciplina vinculada ainda." />
            )}
          </Paper>
        </Grid>
      </Grid>
    </>
  );
}
