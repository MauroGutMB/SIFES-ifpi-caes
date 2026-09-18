import { createTheme } from '@mui/material/styles';
import { ptBR } from '@mui/x-data-grid/locales';
import { tokens } from './tokens';

// Paleta do SIFES — ver pranchas "SIFES Redesign" e "SIFES Formulários".
// Archivo para títulos/botões, Public Sans para texto e campos. Sem sombra fora de diálogo.
const displayFont = "'Archivo', system-ui, sans-serif";
const bodyFont = "'Public Sans', system-ui, -apple-system, sans-serif";

export const theme = createTheme(
  {
  palette: {
    primary: {
      main: tokens.green,
      dark: tokens.greenDeep,
    },
    secondary: {
      main: tokens.yellow,
      contrastText: tokens.yellowText,
    },
    error: {
      main: tokens.red,
      dark: tokens.redText,
    },
    text: {
      primary: tokens.black,
      secondary: tokens.textSecondary,
    },
    background: {
      default: tokens.appBg,
    },
    divider: tokens.border,
  },
  shape: {
    borderRadius: 4,
  },
  typography: {
    fontFamily: bodyFont,
    fontSize: 13,
    h1: { fontFamily: displayFont, fontWeight: 700 },
    h2: { fontFamily: displayFont, fontWeight: 700 },
    h3: { fontFamily: displayFont, fontWeight: 700 },
    h4: { fontFamily: displayFont, fontWeight: 700, fontSize: '1.75rem', letterSpacing: '-0.01em' },
    h5: { fontFamily: displayFont, fontWeight: 700, fontSize: '1.35rem' },
    h6: { fontFamily: displayFont, fontWeight: 700, fontSize: '1.1rem' },
    button: { fontFamily: displayFont, textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true, size: 'small' },
      styleOverrides: {
        root: { height: 44, borderRadius: 4 },
        sizeSmall: { height: 34 },
      },
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
        root: { backgroundColor: tokens.greenDeep },
      },
    },
    MuiToolbar: {
      styleOverrides: {
        root: { minHeight: '56px !important' },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: { backgroundImage: 'none', boxShadow: 'none' },
        outlined: { borderColor: tokens.border },
      },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          border: `1px solid ${tokens.border}`,
          borderTop: `3px solid ${tokens.green}`,
          boxShadow: 'none',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderTop: `4px solid ${tokens.green}`,
          boxShadow: '0 24px 60px rgba(18,68,42,.28)',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { padding: '8px 12px', fontSize: '0.8125rem', borderColor: tokens.border },
        head: {
          fontWeight: 700,
          fontFamily: displayFont,
          fontSize: '0.68rem',
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          color: tokens.textSecondary,
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: { backgroundColor: '#FAFBFA' },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:last-of-type td': { borderBottom: 0 },
          '&.MuiTableRow-hover:hover': { backgroundColor: tokens.greenTint, cursor: 'pointer' },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          paddingTop: 8,
          paddingBottom: 8,
          borderRadius: 4,
          '&:hover': { backgroundColor: tokens.greenTint },
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: { fontFamily: displayFont, fontSize: '1.3rem', fontWeight: 700, padding: '24px 24px 4px' },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          height: 44,
          borderRadius: 4,
          backgroundColor: '#fff',
          '& .MuiOutlinedInput-notchedOutline': { borderColor: tokens.fieldBorder },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: tokens.fieldBorder },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: tokens.green,
            borderWidth: 1,
          },
          '&.Mui-focused': {
            boxShadow: '0 0 0 3px rgba(30,107,65,.18)',
          },
          '&.Mui-error .MuiOutlinedInput-notchedOutline': { borderColor: tokens.red },
          '&.Mui-error.Mui-focused': {
            boxShadow: '0 0 0 3px rgba(229,38,37,.16)',
          },
        },
        input: { color: tokens.black, fontSize: 15 },
        multiline: { height: 'auto' },
      },
    },
    MuiFormHelperText: {
      styleOverrides: {
        root: {
          minHeight: 18,
          marginTop: 6,
          marginLeft: 0,
          fontSize: 12,
          color: tokens.textSecondary,
          '&.Mui-error': { color: tokens.redText },
        },
      },
    },
    MuiInputLabel: {
      defaultProps: { shrink: true },
      styleOverrides: {
        root: {
          position: 'static',
          transform: 'none',
          fontSize: 13,
          fontWeight: 600,
          color: tokens.black,
          marginBottom: 6,
          '&.Mui-focused': { color: tokens.black },
          '&.Mui-error': { color: tokens.black },
        },
      },
    },
    MuiFormControl: {
      styleOverrides: {
        root: { display: 'flex' },
      },
    },
  },
  },
  ptBR,
);
