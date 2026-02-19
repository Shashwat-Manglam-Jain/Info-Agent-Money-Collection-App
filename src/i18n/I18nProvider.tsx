import React, {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

import {
  LANGUAGE_OPTIONS,
  isLanguage,
  type Language,
  type TranslationKey,
  type TranslationParams,
  translate,
} from "./translations";

type WebStorage = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

type I18nContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey, params?: TranslationParams) => string;
  options: typeof LANGUAGE_OPTIONS;
};

const LANGUAGE_KEY = "iamc_language_v1";

function getWebStorage(): WebStorage | null {
  if (Platform.OS !== "web") return null;
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

function getInitialLanguage(): Language {
  const webStorage = getWebStorage();
  if (!webStorage) return "en";
  const raw = webStorage.getItem(LANGUAGE_KEY);
  if (!raw || !isLanguage(raw)) return "en";
  return raw;
}

async function loadLanguage(): Promise<Language | null> {
  try {
    const raw = await getStoredValue(LANGUAGE_KEY);
    if (!raw || !isLanguage(raw)) return null;
    return raw;
  } catch {
    return null;
  }
}

async function saveLanguage(language: Language): Promise<void> {
  try {
    await setStoredValue(LANGUAGE_KEY, language);
  } catch {
    // Ignore persistence failures and continue with in-memory language.
  }
}

const I18nContext = createContext<I18nContextValue>({
  language: "en",
  setLanguage: () => undefined,
  t: (key, params) => translate("en", key, params),
  options: LANGUAGE_OPTIONS,
});

export function I18nProvider({ children }: PropsWithChildren) {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage);
  const [loadedFromStorage, setLoadedFromStorage] = useState(
    Platform.OS === "web"
  );

  useEffect(() => {
    if (Platform.OS === "web") return;
    let active = true;
    (async () => {
      const stored = await loadLanguage();
      if (!active) return;
      if (stored) setLanguageState(stored);
      setLoadedFromStorage(true);
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!loadedFromStorage) return;
    void saveLanguage(language);
  }, [language, loadedFromStorage]);

  const setLanguage = useCallback((nextLanguage: Language) => {
    setLanguageState(nextLanguage);
  }, []);

  const t = useCallback(
    (key: TranslationKey, params?: TranslationParams) =>
      translate(language, key, params),
    [language]
  );

  const value = useMemo<I18nContextValue>(
    () => ({
      language,
      setLanguage,
      t,
      options: LANGUAGE_OPTIONS,
    }),
    [language, setLanguage, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  return useContext(I18nContext);
}
