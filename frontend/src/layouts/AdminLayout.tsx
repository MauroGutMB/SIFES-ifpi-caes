import { useCallback, useEffect, useRef, useState } from 'react';
import { Box, List, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import DashboardIcon from '@mui/icons-material/DashboardOutlined';
import SchoolIcon from '@mui/icons-material/SchoolOutlined';
import GroupIcon from '@mui/icons-material/GroupOutlined';
import ClassIcon from '@mui/icons-material/ClassOutlined';
import EventIcon from '@mui/icons-material/EventOutlined';
import MenuBookIcon from '@mui/icons-material/MenuBookOutlined';
import PhotoCameraIcon from '@mui/icons-material/PhotoCameraOutlined';
import BadgeIcon from '@mui/icons-material/BadgeOutlined';
import { NavLink, Outlet } from 'react-router-dom';

const MIN_WIDTH = 180;
const MAX_WIDTH = 360;
const DEFAULT_WIDTH = 220;
const STORAGE_KEY = 'sifes.adminSidebarWidth';

const ITENS_NAV = [
  { to: '/app/admin', label: 'Início', icon: <DashboardIcon fontSize="small" />, end: true },
  { to: '/app/admin/alunos', label: 'Alunos', icon: <SchoolIcon fontSize="small" /> },
  { to: '/app/admin/professores', label: 'Professores', icon: <GroupIcon fontSize="small" /> },
  { to: '/app/admin/turmas', label: 'Turmas', icon: <ClassIcon fontSize="small" /> },
  { to: '/app/admin/semestres', label: 'Semestres', icon: <EventIcon fontSize="small" /> },
  { to: '/app/admin/materias', label: 'Matérias', icon: <MenuBookIcon fontSize="small" /> },
  {
    to: '/app/admin/solicitacoes-foto',
    label: 'Solicitações de foto',
    icon: <PhotoCameraIcon fontSize="small" />,
  },
  { to: '/app/admin/usuarios', label: 'Usuários', icon: <BadgeIcon fontSize="small" /> },
];

function larguraSalva(): number {
  const valor = Number(localStorage.getItem(STORAGE_KEY));
  return valor >= MIN_WIDTH && valor <= MAX_WIDTH ? valor : DEFAULT_WIDTH;
}

export function AdminLayout() {
  const [largura, setLargura] = useState(larguraSalva);
  const arrastando = useRef(false);

  const iniciarArraste = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    arrastando.current = true;
  }, []);

  useEffect(() => {
    const mover = (event: MouseEvent) => {
      if (!arrastando.current) return;
      const nova = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, event.clientX));
      setLargura(nova);
    };
    const soltar = () => {
      if (!arrastando.current) return;
      arrastando.current = false;
      localStorage.setItem(STORAGE_KEY, String(largura));
    };
    window.addEventListener('mousemove', mover);
    window.addEventListener('mouseup', soltar);
    return () => {
      window.removeEventListener('mousemove', mover);
      window.removeEventListener('mouseup', soltar);
    };
  }, [largura]);

  return (
    <Box sx={{ display: 'flex', mx: -3, my: -3, minHeight: 'calc(100vh - 48px)' }}>
      <Box
        component="nav"
        sx={{
          width: largura,
          flexShrink: 0,
          borderRight: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <List dense>
          {ITENS_NAV.map((item) => (
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
              <ListItemText
                primary={item.label}
                slotProps={{ primary: { sx: { fontSize: '0.85rem' } } }}
              />
            </ListItemButton>
          ))}
        </List>
      </Box>

      <Box
        onMouseDown={iniciarArraste}
        sx={{
          width: '5px',
          cursor: 'col-resize',
          flexShrink: 0,
          '&:hover': { bgcolor: 'primary.main', opacity: 0.4 },
        }}
      />

      <Box sx={{ flexGrow: 1, minWidth: 0, p: 2.5 }}>
        <Outlet />
      </Box>
    </Box>
  );
}
