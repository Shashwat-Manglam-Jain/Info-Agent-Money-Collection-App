import React, { PropsWithChildren, createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { SQLiteDatabase } from 'expo-sqlite';

import { getDb, initDb } from '../db/db';
import { seedDemoData } from '../db/seed';
import { authenticateAgent, getAgentById, getSocietyById } from '../db/repo';
import type { Agent, Society } from '../models/types';
import { clearSession, loadSession, saveSession } from '../storage/session';

type AppContextValue = {
  ready: boolean;
  db: SQLiteDatabase | null;
  society: Society | null;
  agent: Agent | null;
  signIn: (params: { societyCode: string; agentCode: string; pin: string }) => Promise<boolean>;
  signOut: () => Promise<void>;
};

const AppContext = createContext<AppContextValue | null>(null);

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('AppContext not available');
  return ctx;
}

export function AppProvider({ children }: PropsWithChildren) {
  const [ready, setReady] = useState(false);
  const [db, setDb] = useState<SQLiteDatabase | null>(null);
  const [society, setSociety] = useState<Society | null>(null);
  const [agent, setAgent] = useState<Agent | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const database = await getDb();
        await initDb();
        await seedDemoData(database);

        if (!mounted) return;
        setDb(database);

        const session = await loadSession();
        if (!session) return;

        const s = await getSocietyById(database, session.societyId);
        const a = await getAgentById(database, session.agentId);
        if (s && a) {
          setSociety(s);
          setAgent(a);
        } else {
          await clearSession();
        }
      } finally {
        if (mounted) setReady(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      ready,
      db,
      society,
      agent,
      signIn: async ({ societyCode, agentCode, pin }) => {
        if (!db) return false;
        const auth = await authenticateAgent(db, societyCode.trim(), agentCode.trim(), pin);
        if (!auth) return false;
        setSociety(auth.society);
        setAgent(auth.agent);
        await saveSession({ societyId: auth.society.id, agentId: auth.agent.id });
        return true;
      },
      signOut: async () => {
        setSociety(null);
        setAgent(null);
        await clearSession();
      },
    }),
    [agent, db, ready, society]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

