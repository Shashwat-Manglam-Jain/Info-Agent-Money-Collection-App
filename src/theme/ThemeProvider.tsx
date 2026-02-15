import React, { PropsWithChildren, createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';

import { darkTheme, lightTheme, type Theme } from './theme';

export type ThemeMode = 'system' | 'light' | 'dark';

type ThemeContextValue = {
  theme: Theme;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  theme: lightTheme,
  mode: 'dark',
  setMode: () => {},
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: PropsWithChildren) {
  const scheme = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>('dark');

  const resolvedMode = mode === 'system' ? (scheme === 'dark' ? 'dark' : 'light') : mode;
  const theme = useMemo(() => (resolvedMode === 'dark' ? darkTheme : lightTheme), [resolvedMode]);

  const setModeValue = useCallback((nextMode: ThemeMode) => {
    setMode(nextMode);
  }, []);

  const toggleTheme = useCallback(() => {
    setMode((previous) => {
      const current = previous === 'system' ? (scheme === 'dark' ? 'dark' : 'light') : previous;
      return current === 'dark' ? 'light' : 'dark';
    });
  }, [scheme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      mode,
      setMode: setModeValue,
      toggleTheme,
    }),
    [mode, setModeValue, theme, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  return useContext(ThemeContext).theme;
}

export function useThemeController(): Pick<ThemeContextValue, 'mode' | 'setMode' | 'toggleTheme'> {
  const { mode, setMode, toggleTheme } = useContext(ThemeContext);
  return { mode, setMode, toggleTheme };
}
