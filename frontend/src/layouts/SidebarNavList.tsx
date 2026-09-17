import type { ReactNode } from 'react';
import { List, ListItemButton, ListItemIcon, ListItemText, ListSubheader } from '@mui/material';
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
}

/** Uma seção de itens de navegação do painel lateral — usada dentro de SidebarLayout. */
export function SidebarNavList({ titulo, itens }: SidebarNavListProps) {
  return (
    <List
      dense
      subheader={
        titulo ? (
          <ListSubheader
            disableSticky
            sx={{
              fontFamily: "'Archivo', sans-serif",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              lineHeight: '28px',
              color: tokens.textSecondary,
            }}
          >
            {titulo}
          </ListSubheader>
        ) : undefined
      }
    >
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
    </List>
  );
}
