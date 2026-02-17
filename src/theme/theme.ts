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

const sharedRadii: Theme['radii'] = {
  sm: 10,
  md: 16,
  lg: 24,
  pill: 999,
};

const sharedSpacing: Theme['spacing'] = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 20,
  xl: 28,
};

const lightCardShadow: Theme['shadow']['card'] = {
  shadowColor: '#0b1b36',
  shadowOpacity: 0.12,
  shadowRadius: 18,
  shadowOffset: { width: 0, height: 10 },
  elevation: 4,
};

const darkCardShadow: Theme['shadow']['card'] = {
  shadowColor: '#000000',
  shadowOpacity: 0.28,
  shadowRadius: 20,
  shadowOffset: { width: 0, height: 12 },
  elevation: 6,
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
    textSecondary: '#8093ab',
  },
  radii: sharedRadii,
  spacing: sharedSpacing,
  shadow: {
    card: lightCardShadow,
  },
};

export const darkTheme: Theme = {
  isDark: true,
  colors: {
    appBg: '#0A0F1E',
    appBg2: '#1B1736',
    bg: '#0A0F1E',
    bg2: '#24204A',
    surface: '#171C31',
    surfaceAlt: '#111529',
    surfaceTint: '#232948',
    text: '#EEF2FF',
    textOnDark: '#f8fafc',
    muted: '#A5AED1',
    mutedOnDark: 'rgba(165,174,209,0.82)',
    border: '#323A61',
    primary: '#6366F1',
    primary2: '#8B5CF6',
    danger: '#FB7185',
    success: '#34D399',
    primarySoft: 'rgba(99,102,241,0.24)',
    textSecondary: '#717AAC',
  },
  radii: sharedRadii,
  spacing: sharedSpacing,
  shadow: {
    card: darkCardShadow,
  },
};

export const systemTheme: Theme = {
  isDark: false,
  colors: {
    appBg: '#fff1f7',
    appBg2: '#ffe4f1',
    bg: '#4a102a',
    bg2: '#7a1f47',
    surface: '#ffffff',
    surfaceAlt: '#4d1030',
    surfaceTint: '#fff6fb',
    text: '#4d1b35',
    textOnDark: '#fff7fb',
    muted: '#8f5d78',
    mutedOnDark: 'rgba(255,227,240,0.82)',
    border: '#f0cfe0',
    primary: '#e11d74',
    primary2: '#f973b8',
    danger: '#dc2626',
    success: '#16a34a',
    primarySoft: '#ffe0ef',
    textSecondary: '#b9859f',
  },
  radii: sharedRadii,
  spacing: sharedSpacing,
  shadow: {
    card: lightCardShadow,
  },
};

export const oceanTheme: Theme = {
  isDark: true,
  colors: {
    appBg: '#051824',
    appBg2: '#0B2B3C',
    bg: '#04131c',
    bg2: '#0d3a52',
    surface: '#102736',
    surfaceAlt: '#0B1F2B',
    surfaceTint: '#16384b',
    text: '#E7F5FF',
    textOnDark: '#f8fafc',
    muted: '#9FC1D4',
    mutedOnDark: 'rgba(159,193,212,0.80)',
    border: '#26506a',
    primary: '#2FA4FF',
    primary2: '#22D3EE',
    danger: '#FF8A8A',
    success: '#34D399',
    primarySoft: 'rgba(47,164,255,0.24)',
    textSecondary: '#6f9ab3',
  },
  radii: sharedRadii,
  spacing: sharedSpacing,
  shadow: {
    card: darkCardShadow,
  },
};

export const forestTheme: Theme = {
  isDark: false,
  colors: {
    appBg: '#edf7f1',
    appBg2: '#deefe5',
    bg: '#0f1f19',
    bg2: '#1e4332',
    surface: '#ffffff',
    surfaceAlt: '#13221b',
    surfaceTint: '#f2faf5',
    text: '#173129',
    textOnDark: '#f8fafc',
    muted: '#5b7a6d',
    mutedOnDark: 'rgba(218,233,225,0.78)',
    border: '#cfe2d8',
    primary: '#15803d',
    primary2: '#0ea5a2',
    danger: '#dc2626',
    success: '#16a34a',
    primarySoft: '#e5f6eb',
    textSecondary: '#7b9a8d',
  },
  radii: sharedRadii,
  spacing: sharedSpacing,
  shadow: {
    card: lightCardShadow,
  },
};

export const sunsetTheme: Theme = {
  isDark: false,
  colors: {
    appBg: '#fff2ea',
    appBg2: '#ffe7dd',
    bg: '#2b120b',
    bg2: '#5b2215',
    surface: '#ffffff',
    surfaceAlt: '#2b170f',
    surfaceTint: '#fff7f2',
    text: '#40221a',
    textOnDark: '#fff7f2',
    muted: '#8c6258',
    mutedOnDark: 'rgba(255,227,214,0.78)',
    border: '#f2d7cc',
    primary: '#ea580c',
    primary2: '#f43f5e',
    danger: '#dc2626',
    success: '#16a34a',
    primarySoft: '#ffe7da',
    textSecondary: '#b48779',
  },
  radii: sharedRadii,
  spacing: sharedSpacing,
  shadow: {
    card: lightCardShadow,
  },
};

export const amethystTheme: Theme = {
  isDark: true,
  colors: {
    appBg: '#130f21',
    appBg2: '#251d40',
    bg: '#100b1c',
    bg2: '#33265a',
    surface: '#20183a',
    surfaceAlt: '#17112c',
    surfaceTint: '#2c2150',
    text: '#f1ecff',
    textOnDark: '#f8fafc',
    muted: '#b2a8d6',
    mutedOnDark: 'rgba(178,168,214,0.82)',
    border: '#43386a',
    primary: '#8b5cf6',
    primary2: '#ec4899',
    danger: '#fb7185',
    success: '#34d399',
    primarySoft: 'rgba(139,92,246,0.24)',
    textSecondary: '#8378ad',
  },
  radii: sharedRadii,
  spacing: sharedSpacing,
  shadow: {
    card: darkCardShadow,
  },
};
