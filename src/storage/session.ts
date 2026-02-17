import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const SESSION_KEY = 'iamc_session_v1';

export type Session = {
  societyId: string;
  agentId: string;
};

type WebStorage = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

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

async function removeStoredValue(key: string): Promise<void> {
  const webStorage = getWebStorage();
  if (webStorage) {
    webStorage.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export async function loadSession(): Promise<Session | null> {
  const raw = await getStoredValue(SESSION_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Session;
    if (!parsed?.societyId || !parsed?.agentId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function saveSession(session: Session): Promise<void> {
  await setStoredValue(SESSION_KEY, JSON.stringify(session));
}

export async function clearSession(): Promise<void> {
  await removeStoredValue(SESSION_KEY);
}
