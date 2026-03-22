import express from 'express';
import cors from 'cors';
import { routeTask } from './donna';
import { createTask, routeTaskToAgent, getAllTasks, getTask, updateTaskStatus, subscribe } from './taskStore';
import { agents } from './agents';
import { signToken, type JWTPayload } from './auth/jwt';
import { getGoogleAuthUrl, getMicrosoftAuthUrl } from './auth/oauth';
import { authenticate } from './auth/middleware';
import {
  storeEpisodic, storeSemantic, storeProcedural, storeRelational, storePredictive,
  queryMemories, getMemoryStats, seedDemoMemories, type MemoryType,
} from './memory/engine';
import { calculateIQScore } from './memory/iqScore';
import { generateDailyReport } from './memory/report';
import type { TaskEvent } from './types';

const app = express();
const PORT = process.env.PORT || 3001;
const DEMO_TENANT = 'vybekoderz-demo';

app.use(cors());
app.use(express.json());

// Seed demo memories on startup
seedDemoMemories(DEMO_TENANT);

// ============================================================
// SSE — Real-time events
// ============================================================

const sseClients: Set<express.Response> = new Set();

subscribe((event: TaskEvent) => {
  const data = JSON.stringify(event);
  for (const client of sseClients) {
    client.write(`data: ${data}\n\n`);
  }
});

app.get('/api/events', (_req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);
  sseClients.add(res);
  _req.on('close', () => sseClients.delete(res));
});

// ============================================================
// AGENTS
// ============================================================

app.get('/api/agents', (_req, res) => {
  res.json(agents);
});

// ============================================================
// TASKS
// ============================================================

app.get('/api/tasks', (_req, res) => {
  res.json(getAllTasks());
});

app.get('/api/tasks/:id', (req, res) => {
  const task = getTask(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.json(task);
});

app.post('/api/tasks', async (req, res) => {
  const { input } = req.body;
  if (!input || typeof input !== 'string') {
    return res.status(400).json({ error: 'Missing input string' });
  }

  const task = createTask(input);

  try {
    const decision = await routeTask(input);
    const routed = routeTaskToAgent(task.id, decision);

    // Store episodic memory of task creation
    storeEpisodic(DEMO_TENANT, `Task created: "${decision.title}" — routed to ${decision.department}/${decision.specialist}`, 'donna', task.id);

    res.status(201).json({ task: routed, routing: decision });
  } catch {
    updateTaskStatus(task.id, 'error');
    res.status(500).json({ error: 'Routing failed', taskId: task.id });
  }
});

app.patch('/api/tasks/:id/status', (req, res) => {
  const { status } = req.body;
  const valid = ['running', 'waiting', 'error', 'done'];
  if (!valid.includes(status)) {
    return res.status(400).json({ error: `Invalid status. Must be one of: ${valid.join(', ')}` });
  }
  const task = updateTaskStatus(req.params.id, status);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.json(task);
});

// ============================================================
// AUTH — OAuth + JWT
// ============================================================

// Get OAuth URLs
app.get('/api/auth/providers', (_req, res) => {
  res.json({
    google: getGoogleAuthUrl('login'),
    microsoft: getMicrosoftAuthUrl('login'),
  });
});

// Demo login (development only — generates JWT without OAuth)
app.post('/api/auth/demo', (req, res) => {
  const { role = 'agency_admin', name = 'Demo User' } = req.body;
  const payload: JWTPayload = {
    userId: 'demo-user-001',
    tenantId: DEMO_TENANT,
    email: 'demo@vybekoderz.com',
    role,
  };
  const token = signToken(payload);
  res.json({ token, user: { ...payload, name } });
});

// Verify current token
app.get('/api/auth/me', authenticate, (req, res) => {
  res.json(req.auth);
});

// ============================================================
// MEMORY ENGINE
// ============================================================

// Store a new memory
app.post('/api/memory', (req, res) => {
  const { type, content, agentId, metadata } = req.body;
  if (!content || !type) {
    return res.status(400).json({ error: 'Missing content or type' });
  }

  const validTypes: MemoryType[] = ['episodic', 'semantic', 'procedural', 'relational', 'predictive'];
  if (!validTypes.includes(type)) {
    return res.status(400).json({ error: `Invalid type. Must be one of: ${validTypes.join(', ')}` });
  }

  const storeFns = {
    episodic: () => storeEpisodic(DEMO_TENANT, content, agentId),
    semantic: () => storeSemantic(DEMO_TENANT, content, metadata),
    procedural: () => storeProcedural(DEMO_TENANT, content, agentId),
    relational: () => storeRelational(DEMO_TENANT, content),
    predictive: () => storePredictive(DEMO_TENANT, content, metadata),
  };

  const memory = storeFns[type]();
  res.status(201).json(memory);
});

// Query memories
app.get('/api/memory', (req, res) => {
  const { type, agentId, limit, minConfidence } = req.query;
  const results = queryMemories({
    tenantId: DEMO_TENANT,
    type: type as MemoryType | undefined,
    agentId: agentId as string | undefined,
    limit: limit ? parseInt(limit as string) : 20,
    minConfidence: minConfidence ? parseFloat(minConfidence as string) : undefined,
  });
  res.json(results);
});

// Memory stats
app.get('/api/memory/stats', (_req, res) => {
  res.json(getMemoryStats(DEMO_TENANT));
});

// ============================================================
// IQ SCORE
// ============================================================

app.get('/api/iq', (_req, res) => {
  const score = calculateIQScore(DEMO_TENANT);
  res.json(score);
});

// ============================================================
// MEMORY INTELLIGENCE REPORT
// ============================================================

app.get('/api/memory/report', async (_req, res) => {
  try {
    const report = await generateDailyReport(DEMO_TENANT);
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// ============================================================
// BROWSER AGENT
// ============================================================

import {
  createSOP, getSOP, getAllSOPs,
  createSession, getSession, getAllSessions, executeSOP as executeSOPFn,
  captureOverrideStep, learnFromOverride, seedDemoSOPs, onSessionUpdate,
} from './browser/sopExecutor';

// Seed demo SOPs
seedDemoSOPs(DEMO_TENANT);

// Broadcast browser session updates via SSE
onSessionUpdate((session) => {
  const data = JSON.stringify({ type: 'browser_update', session });
  for (const client of sseClients) {
    client.write(`data: ${data}\n\n`);
  }
});

// SOP routes
app.get('/api/sops', (_req, res) => {
  res.json(getAllSOPs(DEMO_TENANT));
});

app.get('/api/sops/:id', (req, res) => {
  const sop = getSOP(req.params.id);
  if (!sop) return res.status(404).json({ error: 'SOP not found' });
  res.json(sop);
});

app.post('/api/sops', (req, res) => {
  const { name, description, agentId, steps } = req.body;
  if (!name || !steps?.length) {
    return res.status(400).json({ error: 'Missing name or steps' });
  }
  const sop = createSOP({ tenantId: DEMO_TENANT, name, description, agentId: agentId || 'sop-executor', steps });
  res.status(201).json(sop);
});

// Browser session routes
app.get('/api/browser/sessions', (_req, res) => {
  res.json(getAllSessions(DEMO_TENANT));
});

app.get('/api/browser/sessions/:id', (req, res) => {
  const session = getSession(req.params.id);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  res.json(session);
});

app.post('/api/browser/sessions', (req, res) => {
  const { taskId, agentId, sopId } = req.body;
  const session = createSession({ tenantId: DEMO_TENANT, taskId, agentId: agentId || 'browser-agent', sopId });
  res.status(201).json(session);
});

app.post('/api/browser/sessions/:id/execute', async (req, res) => {
  try {
    const session = await executeSOPFn(req.params.id);
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.post('/api/browser/sessions/:id/override', (req, res) => {
  const { step } = req.body;
  if (!step) return res.status(400).json({ error: 'Missing step' });
  captureOverrideStep(req.params.id, step);
  res.json({ success: true });
});

app.post('/api/browser/sessions/:id/learn', (req, res) => {
  const sop = learnFromOverride(req.params.id, DEMO_TENANT);
  if (!sop) return res.status(404).json({ error: 'No override steps to learn from' });
  res.json(sop);
});

// ============================================================
// VOICE LAYER
// ============================================================

import {
  createVoiceSession, getVoiceSession,
  transcribeAudio, synthesizeSpeech, extractMeetingActions,
} from './voice/voiceService';

app.post('/api/voice/sessions', (_req, res) => {
  const session = createVoiceSession(DEMO_TENANT);
  res.status(201).json(session);
});

app.get('/api/voice/sessions/:id', (req, res) => {
  const session = getVoiceSession(req.params.id);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  res.json(session);
});

app.post('/api/voice/sessions/:id/transcribe', async (req, res) => {
  try {
    // In production: parse multipart audio buffer
    const audioBuffer = Buffer.from('simulated-audio');
    const entry = await transcribeAudio(req.params.id, audioBuffer);
    res.json(entry);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.post('/api/voice/sessions/:id/speak', async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'Missing text' });
  try {
    const entry = await synthesizeSpeech(req.params.id, text);
    res.json(entry);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.post('/api/voice/meeting-actions', async (req, res) => {
  const { transcript } = req.body;
  if (!transcript) return res.status(400).json({ error: 'Missing transcript' });
  const actions = await extractMeetingActions(transcript);
  res.json(actions);
});

// ============================================================
// INTEGRATION HUB
// ============================================================

import {
  getAllIntegrations, getIntegration, getByCategory, getConnected,
  connectIntegration, disconnectIntegration, healthCheck, getHubStats,
} from './integrations/hub';

app.get('/api/integrations', (req, res) => {
  const { category } = req.query;
  if (category) {
    res.json(getByCategory(category as Parameters<typeof getByCategory>[0]));
  } else {
    res.json(getAllIntegrations());
  }
});

app.get('/api/integrations/stats', (_req, res) => {
  res.json(getHubStats());
});

app.get('/api/integrations/connected', (_req, res) => {
  res.json(getConnected());
});

app.get('/api/integrations/:id', (req, res) => {
  const integration = getIntegration(req.params.id);
  if (!integration) return res.status(404).json({ error: 'Integration not found' });
  res.json(integration);
});

app.post('/api/integrations/:id/connect', (req, res) => {
  const result = connectIntegration(req.params.id, req.body.config);
  if (!result) return res.status(404).json({ error: 'Integration not found' });
  res.json(result);
});

app.post('/api/integrations/:id/disconnect', (req, res) => {
  const result = disconnectIntegration(req.params.id);
  if (!result) return res.status(404).json({ error: 'Integration not found' });
  res.json(result);
});

app.get('/api/integrations/:id/health', (req, res) => {
  res.json(healthCheck(req.params.id));
});

// ============================================================
// START
// ============================================================

app.listen(PORT, () => {
  console.log(`VybeKoderz Agent OS server running on port ${PORT}`);
  console.log(`  Demo tenant: ${DEMO_TENANT}`);
  console.log(`  Memory engine: ${getMemoryStats(DEMO_TENANT).totalMemories} memories seeded`);
  console.log(`  IQ Score: ${calculateIQScore(DEMO_TENANT).totalScore} (${calculateIQScore(DEMO_TENANT).level})`);
  console.log(`  SOPs: ${getAllSOPs(DEMO_TENANT).length} demo SOPs loaded`);
  console.log(`  Integrations: ${getHubStats().total} configured, ${getHubStats().connected} connected`);
});
