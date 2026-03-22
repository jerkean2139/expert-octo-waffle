import { useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, Zap } from 'lucide-react';
import AgentRail from './components/AgentRail';
import DonnaAvatar from './components/DonnaAvatar';
import TaskCard from './components/TaskCard';
import MemoryPanel from './components/MemoryPanel';
import VoiceInputBar from './components/VoiceInputBar';
import RoutingAnimation from './components/RoutingAnimation';
import { tasks, agents, type DepartmentId } from './data/mockData';

export default function App() {
  const [activeAgent, setActiveAgent] = useState<DepartmentId>('donna');

  const activeAgentData = agents.find((a) => a.id === activeAgent);
  const totalTasks = tasks.length;
  const runningTasks = tasks.filter((t) => t.status === 'running').length;

  return (
    <div className="flex h-screen w-screen overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      {/* Left Rail */}
      <AgentRail activeAgent={activeAgent} onSelect={setActiveAgent} />

      {/* Main Canvas */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        <RoutingAnimation />

        {/* Top Bar */}
        <div
          className="flex items-center justify-between px-6 py-3"
          style={{ borderBottom: '1px solid var(--border-subtle)' }}
        >
          <div className="flex items-center gap-3">
            <h1
              className="text-lg font-bold tracking-wide"
              style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)', margin: 0 }}
            >
              Mission Control
            </h1>
            <div
              className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
              style={{ background: 'var(--cyan-dim)', color: 'var(--cyan)', fontFamily: 'var(--font-mono)' }}
            >
              <Activity size={12} />
              <span>{runningTasks} active</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
              VybeKoderz Agent OS v0.1
            </span>
          </div>
        </div>

        {/* Main Content — Bento Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Donna Hero Section */}
          <div className="flex items-center gap-6 mb-6">
            <DonnaAvatar size={72} status="Routing" />
            <div>
              <h2
                className="text-base font-semibold mb-1"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)', margin: 0 }}
              >
                {activeAgentData?.name ?? 'Donna'} — {activeAgentData?.label ?? 'AI Router'}
              </h2>
              <p className="text-xs" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', margin: 0 }}>
                Routing {totalTasks} tasks across {agents.length - 1} departments
              </p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <motion.div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs"
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-subtle)',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--cyan)',
                }}
                animate={{ borderColor: ['rgba(0,212,255,0.2)', 'rgba(0,212,255,0.5)', 'rgba(0,212,255,0.2)'] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Zap size={12} />
                System Nominal
              </motion.div>
            </div>
          </div>

          {/* Bento Grid of Task Cards */}
          <div className="mb-3">
            <h3
              className="text-xs font-medium tracking-widest uppercase mb-3"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--text-muted)' }}
            >
              Active Operations
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {tasks.map((task, i) => (
              <TaskCard key={task.id} task={task} isActive={i === 0} />
            ))}
          </div>

          {/* Agent Status Summary */}
          <div className="mt-6">
            <h3
              className="text-xs font-medium tracking-widest uppercase mb-3"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--text-muted)' }}
            >
              Department Status
            </h3>
            <div className="grid grid-cols-4 gap-3">
              {agents.filter((a) => a.id !== 'donna').map((agent) => (
                <motion.div
                  key={agent.id}
                  className="p-3 rounded-lg cursor-pointer"
                  style={{
                    background: 'var(--bg-elevated)',
                    border: `1px solid ${activeAgent === agent.id ? agent.color + '44' : 'var(--border-subtle)'}`,
                  }}
                  whileHover={{ borderColor: agent.color + '66' }}
                  onClick={() => setActiveAgent(agent.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className="text-sm font-semibold"
                      style={{ fontFamily: 'var(--font-display)', color: agent.color }}
                    >
                      {agent.name}
                    </span>
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{
                        background: agent.status === 'active' ? 'var(--mint)' : agent.status === 'idle' ? 'var(--amber)' : 'var(--red)',
                        boxShadow: `0 0 6px ${agent.status === 'active' ? 'var(--mint)' : agent.status === 'idle' ? 'var(--amber)' : 'var(--red)'}`,
                      }}
                    />
                  </div>
                  <div className="text-xs" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                    {agent.label}
                  </div>
                  <div className="text-xs mt-1" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                    {agent.activeTasks} task{agent.activeTasks !== 1 ? 's' : ''}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Voice Input Bar */}
        <VoiceInputBar />
      </div>

      {/* Right Panel */}
      <MemoryPanel />
    </div>
  );
}
