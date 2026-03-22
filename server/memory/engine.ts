import Anthropic from '@anthropic-ai/sdk';
import { v4 as uuid } from 'uuid';

// ============================================================
// VybeKoderz 5-Layer Memory Engine
//
// Layer 1: Episodic   — conversation + session logs
// Layer 2: Semantic   — facts, preferences, client details
// Layer 3: Procedural — learned SOPs (versioned)
// Layer 4: Relational — relationship graph inside/outside business
// Layer 5: Predictive — pattern-based forecasting
// ============================================================

const client = new Anthropic();

export type MemoryType = 'episodic' | 'semantic' | 'procedural' | 'relational' | 'predictive';

export interface Memory {
  id: string;
  tenantId: string;
  type: MemoryType;
  agentId: string | null;
  scope: 'global' | 'tenant' | 'agent';
  content: string;
  summary: string | null;
  metadata: Record<string, unknown>;
  sourceTaskId: string | null;
  sourceType: string | null;
  confidence: number;
  accessCount: number;
  connections: MemoryConnection[];
  version: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MemoryConnection {
  memoryId: string;
  relationship: string;
  strength: number; // 0-1
}

export interface MemoryQuery {
  tenantId: string;
  type?: MemoryType;
  agentId?: string;
  query?: string;
  limit?: number;
  minConfidence?: number;
}

// In-memory store (will be replaced by DB in production)
const memoryStore: Map<string, Memory> = new Map();

// ============================================================
// MEMORY STORAGE
// ============================================================

export function storeMemory(params: {
  tenantId: string;
  type: MemoryType;
  content: string;
  agentId?: string;
  sourceTaskId?: string;
  sourceType?: string;
  metadata?: Record<string, unknown>;
  confidence?: number;
}): Memory {
  const memory: Memory = {
    id: uuid(),
    tenantId: params.tenantId,
    type: params.type,
    agentId: params.agentId ?? null,
    scope: params.agentId ? 'agent' : 'tenant',
    content: params.content,
    summary: null,
    metadata: params.metadata ?? {},
    sourceTaskId: params.sourceTaskId ?? null,
    sourceType: params.sourceType ?? null,
    confidence: params.confidence ?? 0.8,
    accessCount: 0,
    connections: [],
    version: 1,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  memoryStore.set(memory.id, memory);
  return memory;
}

// ============================================================
// LAYER 1: EPISODIC — conversation + session logs
// ============================================================

export function storeEpisodic(tenantId: string, content: string, agentId?: string, taskId?: string): Memory {
  return storeMemory({
    tenantId,
    type: 'episodic',
    content,
    agentId,
    sourceTaskId: taskId,
    sourceType: 'conversation',
    confidence: 0.95, // direct observations are high confidence
  });
}

// ============================================================
// LAYER 2: SEMANTIC — facts, preferences, client details
// ============================================================

export function storeSemantic(tenantId: string, content: string, metadata?: Record<string, unknown>): Memory {
  return storeMemory({
    tenantId,
    type: 'semantic',
    content,
    metadata,
    sourceType: 'observation',
    confidence: 0.85,
  });
}

// ============================================================
// LAYER 3: PROCEDURAL — learned SOPs (versioned)
// ============================================================

export function storeProcedural(tenantId: string, content: string, agentId?: string, previousId?: string): Memory {
  const memory = storeMemory({
    tenantId,
    type: 'procedural',
    content,
    agentId,
    sourceType: 'sop',
    confidence: 0.9,
  });

  // Version chain
  if (previousId) {
    const previous = memoryStore.get(previousId);
    if (previous) {
      memory.version = previous.version + 1;
      previous.isActive = false; // deactivate old version
    }
  }

  return memory;
}

// ============================================================
// LAYER 4: RELATIONAL — relationship graph
// ============================================================

export function storeRelational(tenantId: string, content: string, connections?: MemoryConnection[]): Memory {
  const memory = storeMemory({
    tenantId,
    type: 'relational',
    content,
    sourceType: 'observation',
    confidence: 0.75,
  });

  if (connections) {
    memory.connections = connections;
    // Bidirectional: add reverse connections
    for (const conn of connections) {
      const target = memoryStore.get(conn.memoryId);
      if (target) {
        target.connections.push({
          memoryId: memory.id,
          relationship: `inverse:${conn.relationship}`,
          strength: conn.strength,
        });
      }
    }
  }

  return memory;
}

// ============================================================
// LAYER 5: PREDICTIVE — pattern-based forecasting
// ============================================================

export function storePredictive(tenantId: string, content: string, metadata?: Record<string, unknown>): Memory {
  return storeMemory({
    tenantId,
    type: 'predictive',
    content,
    metadata: { ...metadata, predictionType: 'pattern' },
    sourceType: 'analysis',
    confidence: 0.7, // predictions start lower confidence
  });
}

// ============================================================
// MEMORY RETRIEVAL
// ============================================================

export function queryMemories(params: MemoryQuery): Memory[] {
  let results = Array.from(memoryStore.values())
    .filter(m => m.tenantId === params.tenantId && m.isActive);

  if (params.type) {
    results = results.filter(m => m.type === params.type);
  }

  if (params.agentId) {
    results = results.filter(m => m.agentId === params.agentId || m.scope !== 'agent');
  }

  if (params.minConfidence) {
    results = results.filter(m => m.confidence >= params.minConfidence);
  }

  // Sort by relevance (confidence * recency)
  results.sort((a, b) => {
    const aScore = a.confidence * (1 / (Date.now() - new Date(a.updatedAt).getTime() + 1));
    const bScore = b.confidence * (1 / (Date.now() - new Date(b.updatedAt).getTime() + 1));
    return bScore - aScore;
  });

  if (params.limit) {
    results = results.slice(0, params.limit);
  }

  // Track access
  for (const m of results) {
    m.accessCount++;
  }

  return results;
}

export function getMemory(id: string): Memory | undefined {
  return memoryStore.get(id);
}

export function getMemoryStats(tenantId: string) {
  const all = Array.from(memoryStore.values()).filter(m => m.tenantId === tenantId && m.isActive);

  const byType: Record<string, number> = {};
  let totalConfidence = 0;
  let connectionCount = 0;
  let predictiveCount = 0;

  for (const m of all) {
    byType[m.type] = (byType[m.type] || 0) + 1;
    totalConfidence += m.confidence;
    connectionCount += m.connections.length;
    if (m.type === 'predictive') predictiveCount++;
  }

  return {
    totalMemories: all.length,
    confidenceAvg: all.length > 0 ? Math.round((totalConfidence / all.length) * 100) : 0,
    connectionCount,
    predictiveTriggers: predictiveCount,
    byType,
  };
}

// ============================================================
// MEMORY ANALYSIS — Claude-powered connection discovery
// ============================================================

export async function analyzeConnections(tenantId: string): Promise<MemoryConnection[]> {
  const recent = queryMemories({ tenantId, limit: 20 });
  if (recent.length < 3) return [];

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6-20250514',
      max_tokens: 1024,
      system: `You analyze memory items and discover connections between them.
Return a JSON array of connections: [{"fromIndex": 0, "toIndex": 1, "relationship": "causes", "strength": 0.8}]
Only return strong, meaningful connections. Maximum 5 connections.`,
      messages: [{
        role: 'user',
        content: `Find connections between these memories:\n${recent.map((m, i) => `[${i}] (${m.type}) ${m.content}`).join('\n')}`,
      }],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '[]';
    const rawConnections = JSON.parse(text);

    const connections: MemoryConnection[] = [];
    for (const conn of rawConnections) {
      const from = recent[conn.fromIndex];
      const to = recent[conn.toIndex];
      if (from && to) {
        const mc: MemoryConnection = {
          memoryId: to.id,
          relationship: conn.relationship,
          strength: conn.strength,
        };
        from.connections.push(mc);
        connections.push(mc);
      }
    }

    return connections;
  } catch {
    return [];
  }
}

// ============================================================
// SEED DEMO MEMORIES
// ============================================================

export function seedDemoMemories(tenantId: string) {
  // Episodic
  storeEpisodic(tenantId, 'Client prefers Loom video walkthroughs over written documentation');
  storeEpisodic(tenantId, 'Weekly standup moved from Monday 9am to Tuesday 10am per client request');
  storeEpisodic(tenantId, 'Browser step learned from human override session: click "Advanced" before "Submit"');

  // Semantic
  storeSemantic(tenantId, 'Acme Corp primary contact: Sarah Chen, VP Operations', { entity: 'Acme Corp', type: 'contact' });
  storeSemantic(tenantId, 'Client billing cycle: net-30, invoice on 1st of month', { type: 'billing' });
  storeSemantic(tenantId, 'Preferred communication: Slack for quick questions, email for formal updates', { type: 'preference' });

  // Procedural
  storeProcedural(tenantId, 'Empire Title Weekly SOP: 1) Login to SoftPro 2) Pull closing schedule 3) Export to CSV 4) Generate Monday briefing 5) Send via Slack');
  storeProcedural(tenantId, 'GHL Follow-up Sequence: Check last contact → Wait 3 days → Send personalized email → Log in CRM → Set reminder for 7 days');

  // Relational
  storeRelational(tenantId, 'Invoice delays correlate with board meeting weeks — CFO unavailable for approvals');
  storeRelational(tenantId, 'Support request volume spikes on Mondays — related to weekend system issues accumulating');

  // Predictive
  storePredictive(tenantId, 'Client likely to request Q2 planning session in next 2 weeks based on previous year pattern', { trigger: 'calendar', dueDate: '2026-04-01' });
  storePredictive(tenantId, 'Outbound response rates drop 40% during March — likely due to fiscal year-end budget freeze', { trigger: 'seasonal', confidence: 0.72 });
}
