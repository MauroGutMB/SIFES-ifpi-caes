import { Card, CardActionArea, CardContent, Grid, Skeleton, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAdminDashboardControllerContagens } from '../../api/generated/admin-dashboard/admin-dashboard';

interface CartaoProps {
  titulo: string;
  valor: number | string;
  destaque?: boolean;
  /** Rota do painel de gestão desse modelo — o cartão vira um atalho pra lá, como o
   * índice de modelos do Django admin. */
  to?: string;
}

function Cartao({ titulo, valor, destaque, to }: CartaoProps) {
  const navigate = useNavigate();
  const conteudo = (
    <CardContent>
      <Typography variant="body2" color="text.secondary">
        {titulo}
      </Typography>
      <Typography variant="h4" color={destaque ? 'error' : undefined}>
        {valor}
      </Typography>
    </CardContent>
  );
  return (
    <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
      <Card>
        {to ? (
          <CardActionArea onClick={() => navigate(to)}>{conteudo}</CardActionArea>
        ) : (
          conteudo
        )}
      </Card>
    </Grid>
  );
}

export function AdminDashboardPage() {
  const { data, isLoading } = useAdminDashboardControllerContagens();

  return (
    <>
      <Typography variant="h4" gutterBottom>
        Painel do administrador
      </Typography>

      {isLoading || !data ? (
        <Grid container spacing={2}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Grid key={i} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
              <Skeleton variant="rounded" height={96} />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Grid container spacing={2}>
          <Cartao
            titulo="Semestre atual"
            valor={data.semestreAtual?.nome ?? 'Nenhum'}
            to="/app/admin/semestres"
          />
          <Cartao titulo="Professores" valor={data.totalProfessores} to="/app/admin/professores" />
          <Cartao titulo="Alunos" valor={data.totalAlunos} to="/app/admin/alunos" />
          <Cartao titulo="Alunos sem turma" valor={data.alunosSemTurma} to="/app/admin/alunos" />
          <Cartao
            titulo="Matérias no semestre atual"
            valor={data.materiasSemestreAtual}
            to="/app/admin/materias"
          />
          <Cartao
            titulo="Alunos com pendência"
            valor={data.alunosComPendencia}
            destaque={data.alunosComPendencia > 0}
            to="/app/admin/solicitacoes-foto"
          />
        </Grid>
      )}
    </>
  );
}
