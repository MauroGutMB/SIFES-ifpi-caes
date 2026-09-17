import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Divider,
  Grid,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material';
import InsightsIcon from '@mui/icons-material/InsightsOutlined';
import ChevronRightIcon from '@mui/icons-material/ChevronRightOutlined';
import { useNavigate } from 'react-router-dom';
import {
  useAlunosControllerAtividadesPendentes,
  useAlunosControllerMeuPerfil,
} from '../../api/generated/alunos/alunos';
import { useMateriasControllerFindAll } from '../../api/generated/materias/materias';
import { WeeklyAgenda } from '../../components/WeeklyAgenda';
import { ContaTab } from './ContaTab';

function agruparPorMateria<T extends { materiaId: string; materiaNome: string }>(itens: T[]) {
  const grupos = new Map<string, { materiaNome: string; itens: T[] }>();
  for (const item of itens) {
    const grupo = grupos.get(item.materiaId) ?? { materiaNome: item.materiaNome, itens: [] };
    grupo.itens.push(item);
    grupos.set(item.materiaId, grupo);
  }
  return Array.from(grupos.values());
}

export function AlunoHomePage() {
  const navigate = useNavigate();
  const { data: perfil } = useAlunosControllerMeuPerfil();
  const { data: materias } = useMateriasControllerFindAll();
  const { data: pendentes } = useAlunosControllerAtividadesPendentes({ limite: '5' });
  const gruposPendentes = agruparPorMateria(pendentes ?? []);

  return (
    <>
      <Typography variant="h4" gutterBottom>
        Olá, {perfil?.nome ?? ''}
      </Typography>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 5 }}>
          <Stack spacing={2}>
            {perfil && <ContaTab perfil={perfil} />}
            <Card variant="outlined">
              <CardActionArea onClick={() => navigate('/app/aluno/situacao')}>
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <InsightsIcon color="primary" />
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="subtitle2">Minha situação</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Presença, atividades e disciplinas em um só lugar
                    </Typography>
                  </Box>
                  <ChevronRightIcon color="action" />
                </CardContent>
              </CardActionArea>
            </Card>

            {gruposPendentes.length > 0 && (
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle2" gutterBottom>
                    Atividades pendentes
                  </Typography>
                  <List disablePadding>
                    {gruposPendentes.map((grupo, indiceGrupo) => (
                      <Box key={grupo.itens[0].materiaId}>
                        {indiceGrupo > 0 && <Divider sx={{ my: 0.5 }} />}
                        <Typography variant="caption" color="text.secondary">
                          {grupo.materiaNome}
                        </Typography>
                        {grupo.itens.map((atividade) => (
                          <ListItemButton
                            key={atividade.id}
                            disableGutters
                            onClick={() =>
                              navigate(`/app/aluno/materias/${atividade.materiaId}`, {
                                state: { tab: 2 },
                              })
                            }
                          >
                            <ListItemText
                              primary={atividade.titulo}
                              secondary={
                                atividade.prazo
                                  ? `Prazo: ${new Date(atividade.prazo).toLocaleString('pt-BR')}`
                                  : undefined
                              }
                            />
                          </ListItemButton>
                        ))}
                      </Box>
                    ))}
                  </List>
                </CardContent>
              </Card>
            )}
          </Stack>
        </Grid>
        <Grid size={{ xs: 12, md: 7 }}>
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Agenda da semana
            </Typography>
            <WeeklyAgenda
              itens={(materias ?? []).map((m) => ({
                id: m.id,
                titulo: m.nome,
                subtitulo: `${m.turma.cursoTecnico} — ${m.turma.anoSerie}`,
                horarios: m.horarios,
              }))}
            />
          </Box>
        </Grid>
      </Grid>
    </>
  );
}
