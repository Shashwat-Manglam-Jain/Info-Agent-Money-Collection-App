export type Theme = {
  isDark: boolean;
  colors: {
    appBg: string;
    appBg2: string;
    bg: string;
    bg2: string;
    surface: string;
    surfaceAlt: string;
    surfaceTint: string;
    text: string;
    textOnDark: string;
    muted: string;
    mutedOnDark: string;
    border: string;
    primary: string;
    primary2: string;
    danger: string;
    success: string;
    primarySoft: string;
  };
  radii: {
    sm: number;
    md: number;
    lg: number;
    pill: number;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  shadow: {
    card: {
      shadowColor: string;
      shadowOpacity: number;
      shadowRadius: number;
      shadowOffset: { width: number; height: number };
      elevation: number;
    };
  };
};

export const lightTheme: Theme = {
  isDark: false,
  colors: {
    appBg: '#f1f5f9',
    appBg2: '#e2e8f0',
    bg: '#0b1220',
    bg2: '#10203a',
    surface: '#ffffff',
    surfaceAlt: '#0b1324',
    surfaceTint: '#f8fafc',
    text: '#0f172a',
    textOnDark: '#f8fafc',
    muted: '#64748b',
    mutedOnDark: 'rgba(255,255,255,0.7)',
    border: '#d7dde6',
    primary: '#2563eb',
    primary2: '#0ea5e9',
    danger: '#dc2626',
    success: '#16a34a',
    primarySoft: '#e7efff',
  },
  radii: {
    sm: 12,
    md: 16,
    lg: 22,
    pill: 999,
  },
  spacing: {
    xs: 6,
    sm: 10,
    md: 16,
    lg: 20,
    xl: 28,
  },
  shadow: {
    card: {
      shadowColor: '#0b1220',
      shadowOpacity: 0.08,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
      elevation: 3,
    },
  },
};

export const darkTheme: Theme = {
  isDark: true,
  colors: {
    appBg: '#0f151f',
    appBg2: '#131c2a',
    bg: '#0c1320',
    bg2: '#15263d',
    surface: '#1b2738',
    surfaceAlt: '#141d2b',
    surfaceTint: '#223146',
    text: '#e6edf3',
    textOnDark: '#f8fafc',
    muted: '#9fb0c0',
    mutedOnDark: 'rgba(159,176,192,0.78)',
    border: '#2b3a52',
    primary: '#5ab1f6',
    primary2: '#4dd7e6',
    danger: '#f98585',
    success: '#43d9a1',
    primarySoft: 'rgba(90,177,246,0.18)',
  },
  radii: {
    sm: 12,
    md: 16,
    lg: 22,
    pill: 999,
  },
  spacing: {
    xs: 6,
    sm: 10,
    md: 16,
    lg: 20,
    xl: 28,
  },
  shadow: {
    card: {
      shadowColor: '#000000',
      shadowOpacity: 0.22,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
      elevation: 4,
    },
  },
};
