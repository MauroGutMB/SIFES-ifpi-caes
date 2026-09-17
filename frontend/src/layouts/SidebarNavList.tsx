import type { ReactNode } from 'react';
import { List, ListItemButton, ListItemIcon, ListItemText, ListSubheader } from '@mui/material';
import { NavLink } from 'react-router-dom';

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
    <List dense subheader={titulo ? <ListSubheader disableSticky>{titulo}</ListSubheader> : undefined}>
      {itens.map((item) => (
        <ListItemButton
          key={item.to}
          component={NavLink}
          to={item.to}
          end={item.end}
          sx={{
            '&.active': {
              bgcolor: 'action.selected',
              borderRight: 3,
              borderColor: 'primary.main',
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: 32 }}>{item.icon}</ListItemIcon>
          <ListItemText primary={item.label} slotProps={{ primary: { sx: { fontSize: '0.85rem' } } }} />
        </ListItemButton>
      ))}
    </List>
  );
}
