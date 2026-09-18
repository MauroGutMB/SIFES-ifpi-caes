// Tokens do redesign SIFES — ver pranchas "SIFES Redesign" e "SIFES Formulários".
// Cores fora do palette padrão do MUI (usadas via sx/style direto, não via theme.palette).
export const tokens = {
  green: '#1E6B41',
  greenDeep: '#12442A',
  greenTint: '#EDF3EF',
  yellow: '#F2C123',
  yellowBg: '#FDF4D9',
  yellowText: '#6B4E00',
  red: '#E52625',
  redText: '#8E1614',
  redBg: '#FBEAEA',
  blue: '#1565C0',
  blueText: '#0D47A1',
  blueBg: '#E8F1FB',
  black: '#222222',
  textSecondary: '#5B6159',
  appBg: '#F5F6F5',
  border: '#E0E2DF',
  fieldBorder: '#C8CCC6',
} as const;

export const shadows = {
  dialog: '0 24px 60px rgba(18,68,42,.28)',
} as const;
