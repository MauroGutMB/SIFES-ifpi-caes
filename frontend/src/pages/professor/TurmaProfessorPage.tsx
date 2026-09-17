import { useEffect } from 'react';
import { Card, CardActionArea, CardContent, Grid, Typography } from '@mui/material';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useMateriasControllerFindAll } from '../../api/generated/materias/materias';
import { resumoHorarios } from '../admin/materias/dias-semana';

export function TurmaProfessorPage() {
  const { turmaId = '' } = useParams();
  const navigate = useNavigate();
  const { data: materias, isLoading } = useMateriasControllerFindAll();

  const materiasDaTurma = (materias ?? []).filter((m) => m.turmaId === turmaId);

  useEffect(() => {
    if (materiasDaTurma.length === 1) {
      navigate(`/app/professor/materias/${materiasDaTurma[0].id}`, { replace: true });
    }
  }, [materiasDaTurma, navigate]);

  if (isLoading) return null;
  if (materiasDaTurma.length === 0) {
    return <Navigate to="/app/professor" replace />;
  }
  if (materiasDaTurma.length === 1) {
    return null; // redirecionando via useEffect
  }

  const turma = materiasDaTurma[0].turma;

  return (
    <>
      <Typography variant="h4" gutterBottom>
        {turma.cursoTecnico} — {turma.anoSerie}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Você leciona mais de uma matéria nessa turma — escolha uma:
      </Typography>

      <Grid container spacing={2}>
        {materiasDaTurma.map((materia) => (
          <Grid key={materia.id} size={{ xs: 12, sm: 6, md: 4 }}>
            <Card>
              <CardActionArea
                onClick={() => navigate(`/app/professor/materias/${materia.id}`)}
              >
                <CardContent>
                  <Typography variant="h6">{materia.nome}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {resumoHorarios(materia.horarios)}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </>
  );
}
