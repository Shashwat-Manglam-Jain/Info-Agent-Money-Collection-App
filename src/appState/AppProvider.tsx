import React, { PropsWithChildren, createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { SQLiteDatabase } from 'expo-sqlite';

import { getDb, initDb } from '../db/db';
import { authenticateAgent, getActiveLot, getAgentById, getSocietyById, saveActiveLot } from '../db/repo';
import type { ActiveLot, Agent, Society } from '../models/types';
import { clearSession, loadSession, saveSession } from '../storage/session';

type AppContextValue = {
  ready: boolean;
  db: SQLiteDatabase | null;
  society: Society | null;
  agent: Agent | null;
  activeLot: ActiveLot | null;
  setActiveLot: (lot: ActiveLot | null) => Promise<void>;
  switchProfile: (params: { societyId: string; agentId: string }) => Promise<boolean>;
  signIn: (params: { societyCode?: string; agentCode: string; pin: string }) => Promise<boolean>;
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
  const [activeLot, setActiveLotState] = useState<ActiveLot | null>(null);

  useEffect(() => {
    let mounted = true;
    const startupFallback = setTimeout(() => {
      // Prevent infinite splash if storage/db init stalls on a specific device.
      if (mounted) setReady(true);
    }, 5000);

    (async () => {
      try {
        const database = await getDb();
        await initDb();
        if (!mounted) return;
        setDb(database);

        const session = await loadSession();
        if (!session) return;

        const s = await getSocietyById(database, session.societyId);
        const a = await getAgentById(database, session.agentId);
        if (s && a) {
          setSociety(s);
          setAgent(a);
          const storedLot = await getActiveLot(database, s.id);
          if (storedLot && mounted) setActiveLotState(storedLot);
        } else {
          await clearSession();
        }
      } catch (error) {
        console.error('App startup init failed:', error);
      } finally {
        clearTimeout(startupFallback);
        if (mounted) setReady(true);
      }
    })();
    return () => {
      mounted = false;
      clearTimeout(startupFallback);
    };
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      ready,
      db,
      society,
      agent,
      activeLot,
      setActiveLot: async (lot) => {
        if (!db || !society) return;
        setActiveLotState(lot);
        await saveActiveLot(db, society.id, lot);
      },
      switchProfile: async ({ societyId, agentId }) => {
        if (!db) return false;
        const s = await getSocietyById(db, societyId);
        const a = await getAgentById(db, agentId);
        if (!s || !a || a.societyId !== s.id) return false;
        setSociety(s);
        setAgent(a);
        const storedLot = await getActiveLot(db, s.id);
        setActiveLotState(storedLot);
        await saveSession({ societyId: s.id, agentId: a.id });
        return true;
      },
      signIn: async ({ societyCode, agentCode, pin }) => {
        if (!db) return false;
        const auth = await authenticateAgent(db, societyCode, agentCode.trim(), pin);
        if (!auth) return false;
        setSociety(auth.society);
        setAgent(auth.agent);
        const storedLot = await getActiveLot(db, auth.society.id);
        setActiveLotState(storedLot);
        await saveSession({ societyId: auth.society.id, agentId: auth.agent.id });
        return true;
      },
      signOut: async () => {
        setSociety(null);
        setAgent(null);
        setActiveLotState(null);
        await clearSession();
      },
    }),
    [activeLot, agent, db, ready, society]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
