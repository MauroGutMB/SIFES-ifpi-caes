import { createTheme } from '@mui/material/styles';

// Paleta do SIFES — ver README.md > Identidade Visual.
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
  },
  shape: {
    borderRadius: 8,
  },
  typography: {
    fontFamily: [
      'Poppins',
      'Roboto',
      '"Segoe UI"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
    },
    MuiAppBar: {
      defaultProps: { color: 'primary', elevation: 0 },
    },
  },
});
