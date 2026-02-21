import React, { PropsWithChildren, createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Platform, useColorScheme } from 'react-native';

import { amethystTheme, darkTheme, forestTheme, lightTheme, oceanTheme, sunsetTheme, systemTheme, type Theme } from './theme';

export type ThemeMode = 'system' | 'light' | 'dark' | 'ocean' | 'forest' | 'sunset' | 'amethyst';
export type ThemeOption = { mode: ThemeMode; label: string; icon: string };
type WebStorage = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

const THEME_MODE_KEY = 'iamc_theme_mode_v1';
const THEME_MODE_VALUES: ThemeMode[] = ['system', 'light', 'dark', 'ocean', 'forest', 'sunset', 'amethyst'];

export const THEME_OPTIONS: ThemeOption[] = [
  { mode: 'system', label: 'System', icon: 'phone-portrait-outline' },
  { mode: 'light', label: 'Light Blue', icon: 'sunny-outline' },
  { mode: 'dark', label: 'Dark Indigo', icon: 'moon-outline' },
  { mode: 'ocean', label: 'Ocean', icon: 'water-outline' },
  { mode: 'forest', label: 'Forest', icon: 'leaf-outline' },
  { mode: 'sunset', label: 'Sunset', icon: 'partly-sunny-outline' },
  { mode: 'amethyst', label: 'Amethyst', icon: 'color-palette-outline' },
];

const CYCLE_MODES: ThemeMode[] = ['light', 'dark', 'ocean', 'forest', 'sunset', 'amethyst'];

type ThemeContextValue = {
  theme: Theme;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  options: ThemeOption[];
};

const ThemeContext = createContext<ThemeContextValue>({
  theme: systemTheme,
  mode: 'ocean',
  setMode: () => {},
  toggleTheme: () => {},
  options: THEME_OPTIONS,
});

function isThemeMode(value: string): value is ThemeMode {
  return THEME_MODE_VALUES.includes(value as ThemeMode);
}

function getWebStorage(): WebStorage | null {
  if (Platform.OS !== 'web') return null;
  const storage = (globalThis as { localStorage?: WebStorage }).localStorage;
  return storage ?? null;
}

async function getStoredValue(key: string): Promise<string | null> {
  const webStorage = getWebStorage();
  if (webStorage) return webStorage.getItem(key);
  return SecureStore.getItemAsync(key);
}

async function setStoredValue(key: string, value: string): Promise<void> {
  const webStorage = getWebStorage();
  if (webStorage) {
    webStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

function getInitialThemeMode(): ThemeMode {
  const webStorage = getWebStorage();
  if (!webStorage) return 'ocean';
  const raw = webStorage.getItem(THEME_MODE_KEY);
  if (!raw || !isThemeMode(raw)) return 'ocean';
  return raw;
}

async function loadThemeMode(): Promise<ThemeMode | null> {
  try {
    const raw = await getStoredValue(THEME_MODE_KEY);
    if (!raw || !isThemeMode(raw)) return null;
    return raw;
  } catch {
    return null;
  }
}

async function saveThemeMode(mode: ThemeMode): Promise<void> {
  try {
    await setStoredValue(THEME_MODE_KEY, mode);
  } catch {
    // Ignore storage write failures so theme changes still work in memory.
  }
}

function resolveThemeFromMode(mode: ThemeMode, _scheme: 'light' | 'dark' | null | undefined): Theme {
  if (mode === 'system') {
    return systemTheme;
  }

  const resolvedMode = mode;
  switch (resolvedMode) {
    case 'light':
      return lightTheme;
    case 'dark':
      return darkTheme;
    case 'ocean':
      return oceanTheme;
    case 'forest':
      return forestTheme;
    case 'sunset':
      return sunsetTheme;
    case 'amethyst':
      return amethystTheme;
    default:
      return lightTheme;
  }
}

export function ThemeProvider({ children }: PropsWithChildren) {
  const scheme = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>(getInitialThemeMode);
  const [loadedFromStorage, setLoadedFromStorage] = useState(Platform.OS === 'web');

  useEffect(() => {
    if (Platform.OS === 'web') return;
    let active = true;
    (async () => {
      const stored = await loadThemeMode();
      if (!active) return;
      if (stored) setMode(stored);
      setLoadedFromStorage(true);
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!loadedFromStorage) return;
    void saveThemeMode(mode);
  }, [loadedFromStorage, mode]);

  const theme = useMemo(() => resolveThemeFromMode(mode, scheme), [mode, scheme]);

  const setModeValue = useCallback((nextMode: ThemeMode) => {
    setMode(nextMode);
  }, []);

  const toggleTheme = useCallback(() => {
    setMode((previous) => {
      const current = previous === 'system' ? (scheme === 'dark' ? 'dark' : 'light') : previous;
      const currentIndex = CYCLE_MODES.indexOf(current);
      if (currentIndex < 0) return CYCLE_MODES[0];
      return CYCLE_MODES[(currentIndex + 1) % CYCLE_MODES.length];
    });
  }, [scheme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      mode,
      setMode: setModeValue,
      toggleTheme,
      options: THEME_OPTIONS,
    }),
    [mode, setModeValue, theme, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  return useContext(ThemeContext).theme;
}

export function useThemeController(): Pick<ThemeContextValue, 'mode' | 'setMode' | 'toggleTheme' | 'options'> {
  const { mode, setMode, toggleTheme, options } = useContext(ThemeContext);
  return { mode, setMode, toggleTheme, options };
}
