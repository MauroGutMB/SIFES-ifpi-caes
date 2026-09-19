import { useState, type ReactNode } from 'react';
import { Collapse, List, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { NavLink } from 'react-router-dom';
import { tokens } from '../theme/tokens';

export interface SidebarNavItem {
  to: string;
  label: string;
  icon: ReactNode;
  end?: boolean;
}

interface SidebarNavListProps {
  titulo?: string;
  itens: SidebarNavItem[];
  /** Só tem efeito com `titulo` — controla se a seção começa aberta ou fechada. */
  defaultAberto?: boolean;
}

function Itens({ itens }: { itens: SidebarNavItem[] }) {
  return (
    <>
      {itens.map((item) => (
        <ListItemButton
          key={item.to}
          component={NavLink}
          to={item.to}
          end={item.end}
          sx={{
            height: 42,
            position: 'relative',
            '&.active': {
              bgcolor: tokens.greenTint,
              color: tokens.greenDeep,
              fontWeight: 600,
              '&::before': {
                content: '""',
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: 4,
                bgcolor: tokens.green,
              },
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: 32, color: 'inherit' }}>{item.icon}</ListItemIcon>
          <ListItemText primary={item.label} slotProps={{ primary: { sx: { fontSize: '0.85rem' } } }} />
        </ListItemButton>
      ))}
    </>
  );
}

/** Uma seção de itens de navegação do painel lateral — usada dentro de SidebarLayout. Com
 * `titulo`, vira um dropdown (título clicável que recolhe/expande a lista); sem `titulo`,
 * é só a lista, como antes. */
export function SidebarNavList({ titulo, itens, defaultAberto = true }: SidebarNavListProps) {
  const [aberto, setAberto] = useState(defaultAberto);

  if (!titulo) {
    return (
      <List dense>
        <Itens itens={itens} />
      </List>
    );
  }

  return (
    <List dense disablePadding>
      <ListItemButton onClick={() => setAberto((v) => !v)} sx={{ height: 32 }}>
        <ListItemText
          primary={titulo}
          slotProps={{
            primary: {
              sx: {
                fontFamily: "'Archivo', sans-serif",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: tokens.textSecondary,
              },
            },
          }}
        />
        {aberto ? (
          <ExpandLessIcon sx={{ fontSize: 18, color: tokens.textSecondary }} />
        ) : (
          <ExpandMoreIcon sx={{ fontSize: 18, color: tokens.textSecondary }} />
        )}
      </ListItemButton>
      <Collapse in={aberto} unmountOnExit>
        <List dense disablePadding>
          <Itens itens={itens} />
        </List>
      </Collapse>
    </List>
  );
}
