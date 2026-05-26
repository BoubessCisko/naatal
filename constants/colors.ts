export const colors = {
  green: '#00A884',
  greenDark: '#008069',
  greenLight: '#d9fdd3',
  bg: '#111b21',
  surface: '#202c33',
  surface2: '#2a3942',
  text: '#e9edef',
  muted: '#8696a0',
  gold: '#F5A623',
  red: '#FF6B6B',
} as const;

export type ColorKey = keyof typeof colors;
