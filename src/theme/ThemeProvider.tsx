import React, { PropsWithChildren, createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';

import { darkTheme, lightTheme, type Theme } from './theme';

const ThemeContext = createContext<Theme>(lightTheme);

export function ThemeProvider({ children }: PropsWithChildren) {
  const scheme = useColorScheme();
  const theme = useMemo(() => (scheme === 'dark' ? darkTheme : lightTheme), [scheme]);
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}
