import { motion } from 'framer-motion';
import { Brain, Link2, AlertTriangle } from 'lucide-react';
import { memories, iqScore, type Memory } from '../data/mockData';
import { useEffect, useState } from 'react';

const typeConfig: Record<Memory['type'], { color: string; label: string; icon: React.ReactNode }> = {
  new: { color: 'var(--cyan)', label: 'New Memories', icon: <Brain size={14} /> },
  connection: { color: 'var(--violet)', label: 'Connections Made', icon: <Link2 size={14} /> },
  flagged: { color: 'var(--amber)', label: 'Flagged Review', icon: <AlertTriangle size={14} /> },
};

function AnimatedCounter({ target }: { target: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const duration = 1500;
    const steps = 30;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [target]);

  return <span>{count}</span>;
}

export default function MemoryPanel() {
  const groupedMemories = {
    new: memories.filter((m) => m.type === 'new'),
    connection: memories.filter((m) => m.type === 'connection'),
    flagged: memories.filter((m) => m.type === 'flagged'),
  };

  const memoryHealth = 82;

  return (
    <div
      className="flex flex-col h-full overflow-y-auto"
      style={{
        width: 320,
        minWidth: 320,
        background: 'var(--bg-surface)',
        borderLeft: '1px solid var(--border-subtle)',
        fontFamily: 'var(--font-mono)',
      }}
    >
      {/* Header */}
      <div className="p-4 pb-3" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <h2 className="text-xs font-medium tracking-widest uppercase mb-0.5" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-secondary)' }}>
          Context Inspector
        </h2>
      </div>

      {/* IQ Score */}
      <div className="p-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="flex items-baseline justify-between mb-1">
          <span className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>IQ Score</span>
          <div className="flex items-center gap-1">
            <motion.span
              className="text-2xl font-bold"
              style={{ color: 'var(--cyan)', fontFamily: 'var(--font-display)' }}
            >
              <AnimatedCounter target={iqScore.current} />
            </motion.span>
            <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--mint-dim, rgba(0,255,156,0.15))', color: 'var(--mint)' }}>
              +{iqScore.weeklyDelta}
            </span>
          </div>
        </div>
        <div className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>
          {iqScore.level} Level
        </div>
      </div>

      {/* Memory Health */}
      <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Memory Health</span>
          <span className="text-xs" style={{ color: 'var(--mint)' }}>{memoryHealth}%</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, var(--cyan), var(--mint))' }}
            initial={{ width: 0 }}
            animate={{ width: `${memoryHealth}%` }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Memory Sections */}
      <div className="flex-1 overflow-y-auto">
        {(['new', 'connection', 'flagged'] as const).map((type) => {
          const config = typeConfig[type];
          const items = groupedMemories[type];
          if (items.length === 0) return null;
          return (
            <div key={type} className="px-4 py-3" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              <div className="flex items-center gap-1.5 mb-2">
                <span style={{ color: config.color }}>{config.icon}</span>
                <span className="text-xs uppercase tracking-wider" style={{ color: config.color }}>
                  {config.label}
                </span>
              </div>
              {items.map((memory) => (
                <motion.div
                  key={memory.id}
                  className="mb-2 p-2 rounded-md text-xs leading-relaxed"
                  style={{
                    background: 'var(--bg-elevated)',
                    color: 'var(--text-primary)',
                    borderLeft: `2px solid ${config.color}`,
                  }}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div>{memory.text}</div>
                  <div className="mt-1" style={{ color: 'var(--text-muted)', fontSize: '10px' }}>
                    {memory.timestamp}
                  </div>
                </motion.div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
