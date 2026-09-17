import { createTheme } from '@mui/material/styles';

// Paleta do SIFES — ver README.md > Identidade Visual.
// Visual flat e compacto: cantos quase retos, sem sombra, componentes pequenos por padrão.
export const theme = createTheme({
  palette: {
    primary: {
      main: '#1E6B41',
    },
    secondary: {
      main: '#F2C123',
      contrastText: '#222222',
    },
    error: {
      main: '#E52625',
    },
    text: {
      primary: '#222222',
    },
    background: {
      default: '#F5F6F5',
    },
    divider: '#E0E2DF',
  },
  shape: {
    borderRadius: 4,
  },
  typography: {
    fontFamily: ['Inter', 'Roboto', '"Segoe UI"', 'Arial', 'sans-serif'].join(','),
    fontSize: 13,
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 600, fontSize: '1.75rem' },
    h5: { fontWeight: 600, fontSize: '1.35rem' },
    h6: { fontWeight: 600, fontSize: '1.1rem' },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true, size: 'small' },
    },
    MuiTextField: {
      defaultProps: { size: 'small' },
    },
    MuiSelect: {
      defaultProps: { size: 'small' },
    },
    MuiIconButton: {
      defaultProps: { size: 'small' },
    },
    MuiChip: {
      defaultProps: { size: 'small' },
    },
    MuiAppBar: {
      defaultProps: { color: 'primary', elevation: 0 },
      styleOverrides: {
        root: { borderBottom: '1px solid rgba(0,0,0,0.08)' },
      },
    },
    MuiToolbar: {
      styleOverrides: {
        root: { minHeight: '48px !important' },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: { backgroundImage: 'none' },
        outlined: { borderColor: '#E0E2DF' },
      },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: { border: '1px solid #E0E2DF' },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { padding: '6px 12px', fontSize: '0.8125rem' },
        head: { fontWeight: 600 },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: { paddingTop: 6, paddingBottom: 6 },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: { fontSize: '1.05rem', fontWeight: 600, padding: '16px 20px' },
      },
    },
  },
});
