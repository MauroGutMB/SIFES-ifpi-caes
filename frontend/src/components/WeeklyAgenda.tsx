import { Box, Paper, Tooltip, Typography } from '@mui/material';
import { DIAS_SEMANA } from '../pages/admin/materias/dias-semana';

export interface AgendaHorario {
  diaSemana: string;
  horaInicio: string;
}

export interface AgendaItem {
  id: string;
  titulo: string;
  subtitulo?: string;
  horarios: AgendaHorario[];
}

interface WeeklyAgendaProps {
  itens: AgendaItem[];
}

const HORAS = Array.from({ length: 11 }, (_, i) => 7 + i); // 7h..17h (janela 7h-18h, aulas de 1h)

const PALETA = ['#1E6B41', '#2E7D32', '#0277BD', '#6A1B9A', '#AD5C00', '#00695C', '#5D4037'];

function corPara(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return PALETA[hash % PALETA.length];
}

export function WeeklyAgenda({ itens }: WeeklyAgendaProps) {
  const diasComAula = new Set(itens.flatMap((item) => item.horarios.map((h) => h.diaSemana)));
  const dias = DIAS_SEMANA.filter(
    (d) => d.value !== 'SABADO' || diasComAula.has('SABADO'),
  );

  interface Celula {
    item: AgendaItem;
    horario: AgendaHorario;
  }
  const porCelula = new Map<string, Celula[]>();
  for (const item of itens) {
    for (const horario of item.horarios) {
      const hora = Number(horario.horaInicio.slice(0, 2));
      const chave = `${horario.diaSemana}-${hora}`;
      const lista = porCelula.get(chave) ?? [];
      lista.push({ item, horario });
      porCelula.set(chave, lista);
    }
  }

  if (itens.length === 0) {
    return (
      <Typography color="text.secondary" variant="body2">
        Nenhum horário cadastrado ainda.
      </Typography>
    );
  }

  return (
    <Paper variant="outlined" sx={{ overflowX: 'auto' }}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: `64px repeat(${dias.length}, minmax(120px, 1fr))`,
          minWidth: 120 * dias.length + 64,
        }}
      >
        <Box sx={{ p: 1 }} />
        {dias.map((dia) => (
          <Box
            key={dia.value}
            sx={{
              p: 1,
              textAlign: 'center',
              fontWeight: 600,
              fontSize: '0.8rem',
              borderLeft: 1,
              borderColor: 'divider',
            }}
          >
            {dia.label}
          </Box>
        ))}

        {HORAS.map((hora) => (
          <Box key={hora} sx={{ display: 'contents' }}>
            <Box
              sx={{
                p: 1,
                fontSize: '0.75rem',
                color: 'text.secondary',
                borderTop: 1,
                borderColor: 'divider',
              }}
            >
              {String(hora).padStart(2, '0')}:00
            </Box>
            {dias.map((dia) => {
              const celulas = porCelula.get(`${dia.value}-${hora}`) ?? [];
              return (
                <Box
                  key={dia.value}
                  sx={{
                    p: 0.5,
                    minHeight: 44,
                    borderTop: 1,
                    borderLeft: 1,
                    borderColor: 'divider',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 0.5,
                  }}
                >
                  {celulas.map(({ item, horario }) => (
                    <Tooltip
                      key={`${item.id}-${horario.horaInicio}`}
                      title={item.subtitulo ? `${item.titulo} — ${item.subtitulo}` : item.titulo}
                    >
                      <Box
                        sx={{
                          bgcolor: corPara(item.id),
                          color: '#fff',
                          borderRadius: 0.5,
                          px: 0.75,
                          py: 0.25,
                          fontSize: '0.7rem',
                          lineHeight: 1.3,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {item.titulo}
                      </Box>
                    </Tooltip>
                  ))}
                </Box>
              );
            })}
          </Box>
        ))}
      </Box>
    </Paper>
  );
}
