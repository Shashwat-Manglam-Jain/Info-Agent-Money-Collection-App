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
    textSecondary: string;
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
    appBg: '#eef4ff',
    appBg2: '#e2f0ff',
    bg: '#08162c',
    bg2: '#153a61',
    surface: '#ffffff',
    surfaceAlt: '#0e1b33',
    surfaceTint: '#f6f9ff',
    text: '#112542',
    textOnDark: '#f8fafc',
    muted: '#5c6f8e',
    mutedOnDark: 'rgba(255,255,255,0.7)',
    border: '#d5deec',
    primary: '#0f6af6',
    primary2: '#00b2d4',
    danger: '#dc2626',
    success: '#16a34a',
    primarySoft: '#e8f0ff',
    textSecondary: '#8093ab'
  },
  radii: {
    sm: 10,
    md: 16,
    lg: 24,
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
      shadowColor: '#0b1b36',
      shadowOpacity: 0.12,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 10 },
      elevation: 4,
    },
  },
};

export const darkTheme: Theme = {
  isDark: true,
  colors: {
    appBg: '#091320',
    appBg2: '#11253c',
    bg: '#07101d',
    bg2: '#15324f',
    surface: '#18283d',
    surfaceAlt: '#111f33',
    surfaceTint: '#22364f',
    text: '#e8eff8',
    textOnDark: '#f8fafc',
    muted: '#99adc4',
    mutedOnDark: 'rgba(159,176,192,0.78)',
    border: '#2d415d',
    primary: '#69b8ff',
    primary2: '#3bd9ef',
    danger: '#f98585',
    success: '#43d9a1',
    primarySoft: 'rgba(105,184,255,0.24)',
     textSecondary: '#51769c'

  },
  radii: {
    sm: 10,
    md: 16,
    lg: 24,
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
      shadowOpacity: 0.28,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 12 },
      elevation: 6,
    },
  },
};
