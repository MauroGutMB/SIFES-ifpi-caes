import { useState } from 'react';
import { Box, Button, Grid, Paper, Stack, Typography } from '@mui/material';
import DownloadIcon from '@mui/icons-material/DownloadOutlined';
import { FotoPopup } from '../../components/FotoPopup';
import { isAxiosError } from 'axios';
import { useQueryClient } from '@tanstack/react-query';
import {
  getUsersControllerMeQueryKey,
  useUsersControllerMe,
  useUsersControllerUpdateFoto,
} from '../../api/generated/users/users';
import { useMateriasControllerFindAll } from '../../api/generated/materias/materias';
import { urlArquivo } from '../../api/arquivo-url';
import { baixarArquivo } from '../../api/download';
import { WeeklyAgenda } from '../../components/WeeklyAgenda';

export function ProfessorHomePage() {
  const queryClient = useQueryClient();
  const { data: me } = useUsersControllerMe();
  const { data: materias } = useMateriasControllerFindAll();
  const atualizarFoto = useUsersControllerUpdateFoto();
  const [erroFoto, setErroFoto] = useState<string | null>(null);
  const [baixando, setBaixando] = useState<string | null>(null);
  const professor = materias?.[0]?.professor;
  // A agenda é o horário de aulas de AGORA — matérias de semestres já encerrados usam os
  // mesmos slots de dia/hora (ex: sempre Segunda 08h pro turno da manhã), então incluí-las
  // faria a grade mostrar duas disciplinas empilhadas na mesma célula.
  const materiasAbertas = (materias ?? []).filter((m) => m.estado === 'ABERTA');

  const baixarAgenda = async (formato: 'pdf' | 'xlsx') => {
    setBaixando(formato);
    try {
      await baixarArquivo(`/relatorios/agenda?formato=${formato}`, `agenda-semanal.${formato}`);
    } finally {
      setBaixando(null);
    }
  };

  const trocarFoto = async (arquivo: File) => {
    setErroFoto(null);
    try {
      await atualizarFoto.mutateAsync({ data: { foto: arquivo } });
      await queryClient.invalidateQueries({ queryKey: getUsersControllerMeQueryKey() });
    } catch (error) {
      setErroFoto(
        isAxiosError(error)
          ? ((error.response?.data as { message?: string } | undefined)?.message ??
            'Não foi possível trocar a foto')
          : 'Não foi possível trocar a foto',
      );
    }
  };

  return (
    <>
      <Typography variant="h4" gutterBottom>
        Olá, {professor?.nome ?? ''}
      </Typography>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 2 }}>
              <FotoPopup src={urlArquivo(me?.fotoUrl)} sx={{ width: 64, height: 64 }} />
              <div>
                <Typography variant="h6">{professor?.nome ?? me?.login}</Typography>
                {professor && (
                  <Typography variant="body2" color="text.secondary">
                    {professor.email}
                  </Typography>
                )}
              </div>
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              {materias?.length ?? 0} disciplina(s) atribuída(s)
            </Typography>
            <Button component="label" variant="outlined" size="small" disabled={atualizarFoto.isPending}>
              Trocar foto
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={(e) => {
                  const arquivo = e.target.files?.[0];
                  if (arquivo) trocarFoto(arquivo);
                }}
              />
            </Button>
            {erroFoto && (
              <Typography color="error" variant="body2" sx={{ mt: 1 }}>
                {erroFoto}
              </Typography>
            )}
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 7 }}>
          <Box>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', flexWrap: 'wrap', mb: 1 }}>
              <Typography variant="subtitle1">Agenda da semana</Typography>
              <Stack direction="row" spacing={1}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  disabled={baixando === 'pdf'}
                  onClick={() => baixarAgenda('pdf')}
                >
                  PDF
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  disabled={baixando === 'xlsx'}
                  onClick={() => baixarAgenda('xlsx')}
                >
                  Excel
                </Button>
              </Stack>
            </Stack>
            <WeeklyAgenda
              mostrarTurma
              itens={materiasAbertas.map((m) => ({
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
