export const colors = {
  navy: '#1E2D45',
  cream: '#F5F0E8',
  creamDark: '#EDE8DF',
  sand: '#C8B89A',
  sandLight: '#E8E0D0',
  accent: '#2D4A6B',
  accentLight: '#4A6E96',
  destructive: '#8B1A1A',
  status: {
    current: '#1E2D45',
    want: '#8B6F4E',
    finished: '#6B7280',
    sample: '#4A6E96',
    dupe: '#5C4A3A',
  },
  live: '#22c55e',
} as const;

export const spacing = {
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
} as const;

export const typography = {
  xs: '11px',
  sm: '13px',
  base: '15px',
  md: '17px',
  lg: '20px',
  xl: '26px',
  '2xl': '36px',
  hero: '56px',
} as const;

export const layout = {
  sidebarWidth: '220px',
  headerHeight: '56px',
  contentPaddingDesktop: '40px',
  contentPaddingMobile: '20px',
} as const;

export const breakpoints = {
  mobile: 768,
  tablet: 1024,
} as const;
