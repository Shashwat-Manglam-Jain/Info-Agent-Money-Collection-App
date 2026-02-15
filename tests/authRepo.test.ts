import { describe, expect, it, vi } from 'vitest';

vi.mock('expo-crypto', () => ({
  CryptoDigestAlgorithm: { SHA256: 'SHA256' },
  digestStringAsync: async (_algo: string, input: string) => `hash:${input}`,
  randomUUID: (() => {
    let id = 0;
    return () => `uuid-${++id}`;
  })(),
}));

import { authenticateAgent, updateAgentPinByCode } from '../src/db/repo';

type SocietyRow = {
  id: string;
  code: string;
  name: string;
};

type AgentRow = {
  id: string;
  society_id: string;
  code: string;
  name: string;
  phone: string | null;
  pin_hash: string;
  is_active: number;
};

function createDb(params?: { societies?: SocietyRow[]; agents?: AgentRow[] }) {
  const societies: SocietyRow[] = params?.societies ?? [
    { id: 'soc-1', code: 'S001', name: 'Society One' },
    { id: 'soc-2', code: 'S002', name: 'Society Two' },
  ];
  const agents: AgentRow[] = params?.agents ?? [
    {
      id: 'agent-1',
      society_id: 'soc-1',
      code: 'AG01',
      name: 'Agent One',
      phone: null,
      pin_hash: 'hash:soc-1:1234',
      is_active: 1,
    },
  ];

  const db = {
    getAllAsync: async (sql: string, ...sqlParams: unknown[]) => {
      if (!sql.includes('FROM agents a') || !sql.includes('JOIN societies s ON s.id = a.society_id')) return [];

      let rows = agents.filter((a) => a.is_active === 1);
      if (sql.includes('WHERE s.code = ? AND a.code = ? AND a.is_active = 1')) {
        const [societyCode, agentCode] = sqlParams as string[];
        const society = societies.find((s) => s.code === societyCode);
        rows = society ? rows.filter((a) => a.society_id === society.id && a.code === agentCode) : [];
      } else if (sql.includes('WHERE a.code = ? AND a.is_active = 1')) {
        const [agentCode] = sqlParams as string[];
        rows = rows.filter((a) => a.code === agentCode);
      } else {
        return [];
      }

      const joined = rows
        .map((a) => {
          const society = societies.find((s) => s.id === a.society_id);
          if (!society) return null;
          return { ...a, society_code: society.code, society_name: society.name };
        })
        .filter(Boolean);

      if (sql.includes('LIMIT 2')) return joined.slice(0, 2);
      return joined;
    },
    runAsync: async (sql: string, ...sqlParams: unknown[]) => {
      if (sql.includes('UPDATE agents SET pin_hash = ? WHERE id = ?;')) {
        const [pinHash, agentId] = sqlParams as string[];
        const row = agents.find((a) => a.id === agentId);
        if (row) row.pin_hash = pinHash;
      }
      return {};
    },
  };

  return { db: db as any, societies, agents };
}

describe('auth repository helpers', () => {
  it('authenticates with explicit society code', async () => {
    const { db } = createDb();
    const auth = await authenticateAgent(db, 'S001', 'AG01', '1234');

    expect(auth?.society.code).toBe('S001');
    expect(auth?.agent.code).toBe('AG01');
  });

  it('authenticates without society code when pin matches exactly one profile', async () => {
    const { db } = createDb({
      agents: [
        {
          id: 'agent-1',
          society_id: 'soc-1',
          code: 'AG01',
          name: 'Agent One',
          phone: null,
          pin_hash: 'hash:soc-1:1234',
          is_active: 1,
        },
        {
          id: 'agent-2',
          society_id: 'soc-2',
          code: 'AG01',
          name: 'Agent Two',
          phone: null,
          pin_hash: 'hash:soc-2:9999',
          is_active: 1,
        },
      ],
    });

    const auth = await authenticateAgent(db, '', 'AG01', '1234');
    expect(auth?.society.id).toBe('soc-1');
    expect(auth?.agent.id).toBe('agent-1');
  });

  it('returns null when no-society login matches multiple profiles', async () => {
    const { db } = createDb({
      agents: [
        {
          id: 'agent-1',
          society_id: 'soc-1',
          code: 'AG01',
          name: 'Agent One',
          phone: null,
          pin_hash: 'hash:soc-1:1234',
          is_active: 1,
        },
        {
          id: 'agent-2',
          society_id: 'soc-2',
          code: 'AG01',
          name: 'Agent Two',
          phone: null,
          pin_hash: 'hash:soc-2:1234',
          is_active: 1,
        },
      ],
    });

    const auth = await authenticateAgent(db, null, 'AG01', '1234');
    expect(auth).toBeNull();
  });

  it('updates pin for a unique agent code', async () => {
    const { db, agents } = createDb();
    const result = await updateAgentPinByCode(db, { agentCode: 'AG01', pin: '5678' });

    expect(result).toBe('updated');
    expect(agents[0].pin_hash).toBe('hash:soc-1:5678');
  });

  it('updates pin with society code even when agent code exists in multiple societies', async () => {
    const { db, agents } = createDb({
      agents: [
        {
          id: 'agent-1',
          society_id: 'soc-1',
          code: 'AG01',
          name: 'Agent One',
          phone: null,
          pin_hash: 'hash:soc-1:1234',
          is_active: 1,
        },
        {
          id: 'agent-2',
          society_id: 'soc-2',
          code: 'AG01',
          name: 'Agent Two',
          phone: null,
          pin_hash: 'hash:soc-2:9999',
          is_active: 1,
        },
      ],
    });

    const result = await updateAgentPinByCode(db, {
      societyCode: 'S002',
      agentCode: 'AG01',
      pin: '7777',
    });

    expect(result).toBe('updated');
    expect(agents.find((a) => a.id === 'agent-1')?.pin_hash).toBe('hash:soc-1:1234');
    expect(agents.find((a) => a.id === 'agent-2')?.pin_hash).toBe('hash:soc-2:7777');
  });

  it('returns ambiguous result when updating pin without society and code is duplicated', async () => {
    const { db } = createDb({
      agents: [
        {
          id: 'agent-1',
          society_id: 'soc-1',
          code: 'AG01',
          name: 'Agent One',
          phone: null,
          pin_hash: 'hash:soc-1:1234',
          is_active: 1,
        },
        {
          id: 'agent-2',
          society_id: 'soc-2',
          code: 'AG01',
          name: 'Agent Two',
          phone: null,
          pin_hash: 'hash:soc-2:9999',
          is_active: 1,
        },
      ],
    });

    const result = await updateAgentPinByCode(db, {
      agentCode: 'AG01',
      pin: '7777',
    });

    expect(result).toBe('ambiguous_agent_code');
  });
});
