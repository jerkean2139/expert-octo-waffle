export type TaskStatus = 'running' | 'waiting' | 'error' | 'done';
export type AgentStatus = 'active' | 'idle' | 'error';
export type DepartmentId = 'donna' | 'sales' | 'ops' | 'marketing' | 'dev';

export interface Task {
  id: string;
  title: string;
  department: DepartmentId;
  agentName: string;
  status: TaskStatus;
  progress: number;
}

export interface Agent {
  id: DepartmentId;
  name: string;
  label: string;
  status: AgentStatus;
  activeTasks: number;
  color: string;
}

export interface Memory {
  id: string;
  text: string;
  type: 'new' | 'connection' | 'flagged';
  timestamp: string;
}

export const agents: Agent[] = [
  { id: 'donna', name: 'Donna', label: 'AI Router', status: 'active', activeTasks: 4, color: 'var(--cyan)' },
  { id: 'sales', name: 'Rex', label: 'Sales', status: 'active', activeTasks: 2, color: 'var(--violet)' },
  { id: 'ops', name: 'Atlas', label: 'Operations', status: 'idle', activeTasks: 1, color: 'var(--orange)' },
  { id: 'marketing', name: 'Pixel', label: 'Marketing', status: 'active', activeTasks: 1, color: 'var(--mint)' },
  { id: 'dev', name: 'Forge', label: 'Dev', status: 'error', activeTasks: 0, color: 'var(--amber)' },
];

export const tasks: Task[] = [
  {
    id: 't1',
    title: 'Outbound lead qualification — Q2 pipeline',
    department: 'sales',
    agentName: 'Rex',
    status: 'running',
    progress: 67,
  },
  {
    id: 't2',
    title: 'Inventory restock forecast — warehouse 3',
    department: 'ops',
    agentName: 'Atlas',
    status: 'waiting',
    progress: 34,
  },
  {
    id: 't3',
    title: 'Social campaign A/B test — spring launch',
    department: 'marketing',
    agentName: 'Pixel',
    status: 'done',
    progress: 100,
  },
  {
    id: 't4',
    title: 'CI/CD pipeline migration — GitHub Actions',
    department: 'dev',
    agentName: 'Forge',
    status: 'error',
    progress: 42,
  },
];

export const memories: Memory[] = [
  { id: 'm1', text: 'Rex closed 3 deals above $50k threshold this week', type: 'new', timestamp: '2m ago' },
  { id: 'm2', text: 'Pattern detected: ops delays correlate with marketing launches', type: 'connection', timestamp: '8m ago' },
  { id: 'm3', text: 'Forge pipeline failure rate exceeds 15% — review needed', type: 'flagged', timestamp: '14m ago' },
  { id: 'm4', text: 'New CRM integration data synced — 2,847 contacts updated', type: 'new', timestamp: '22m ago' },
  { id: 'm5', text: 'Sales-to-ops handoff latency improved 23% after routing change', type: 'connection', timestamp: '31m ago' },
  { id: 'm6', text: 'Marketing spend anomaly detected in ad account #4', type: 'flagged', timestamp: '45m ago' },
];

export const iqScore = {
  current: 74,
  level: 'Expert',
  weeklyDelta: 3,
};

export const deptColorMap: Record<DepartmentId, string> = {
  donna: 'var(--cyan)',
  sales: 'var(--violet)',
  ops: 'var(--orange)',
  marketing: 'var(--mint)',
  dev: 'var(--amber)',
};

export const statusConfig: Record<TaskStatus, { color: string; label: string }> = {
  running: { color: 'var(--mint)', label: 'Running' },
  waiting: { color: 'var(--amber)', label: 'Waiting' },
  error: { color: 'var(--red)', label: 'Error' },
  done: { color: 'var(--mint)', label: 'Done' },
};
