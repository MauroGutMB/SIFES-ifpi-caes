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

const DRAWER_WIDTH = 240;

const ITENS_NAV = [
  { to: '/app/admin', label: 'Início', icon: <DashboardIcon />, end: true },
  { to: '/app/admin/alunos', label: 'Alunos', icon: <SchoolIcon /> },
  { to: '/app/admin/professores', label: 'Professores', icon: <GroupIcon /> },
  { to: '/app/admin/turmas', label: 'Turmas', icon: <ClassIcon /> },
  { to: '/app/admin/semestres', label: 'Semestres', icon: <EventIcon /> },
  { to: '/app/admin/materias', label: 'Matérias', icon: <MenuBookIcon /> },
  {
    to: '/app/admin/solicitacoes-foto',
    label: 'Solicitações de foto',
    icon: <PhotoCameraIcon />,
  },
  { to: '/app/admin/usuarios', label: 'Usuários', icon: <BadgeIcon /> },
];

export function AdminLayout() {
  return (
    <Box sx={{ display: 'flex', mx: -3, my: -3, minHeight: 'calc(100vh - 64px)' }}>
      <Box
        component="nav"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          borderRight: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <List>
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
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          ))}
        </List>
      </Box>

      <Box sx={{ flexGrow: 1, minWidth: 0, p: 3 }}>
        <Outlet />
      </Box>
    </Box>
  );
}
