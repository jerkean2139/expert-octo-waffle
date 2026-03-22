import { useState } from 'react';
import { motion } from 'framer-motion';
import { memories, iqMetrics } from '../data/mockData';

const memTypeConfig = {
  new: { label: 'New Memories (Yesterday)', className: 'text-cyan', itemClass: 'border-l-cyan bg-[var(--cyan-dim)]' },
  connection: { label: 'Connections Made', className: 'text-violet', itemClass: 'border-l-violet bg-[var(--violet-dim)]' },
  flagged: { label: 'Flagged for Review', className: 'text-amber', itemClass: 'border-l-amber bg-[var(--amber-dim)]' },
};

const tabs = ['Memory', 'IQ Score', 'Log'] as const;

export default function MemoryPanel() {
  const [activeTab, setActiveTab] = useState<typeof tabs[number]>('Memory');

  const newMems = memories.filter(m => m.type === 'new');
  const connections = memories.filter(m => m.type === 'connection');
  const flagged = memories.filter(m => m.type === 'flagged');

  return (
    <aside className="w-[320px] bg-bg-surface-1 border-l border-border-default flex flex-col overflow-hidden shrink-0">
      {/* Tabs */}
      <div className="flex border-b border-border-default">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 px-2 font-body text-[10px] tracking-wide uppercase text-center cursor-pointer border-b-2 transition-colors duration-200
              ${activeTab === tab ? 'text-cyan border-b-cyan' : 'text-text-muted border-b-transparent'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {/* IQ Score Panel */}
        <div className="bg-bg-surface-2 border border-border-default rounded-lg p-3.5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <motion.div
                className="font-display text-[32px] font-bold text-mint leading-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                84
              </motion.div>
              <div className="font-body text-[10px] text-mint tracking-wide uppercase">Master Level</div>
            </div>
            <div className="font-body text-[10px] text-text-muted text-right">
              ↑ +3 this week<br />
              <span className="text-text-muted">Next test Mar 28</span>
            </div>
          </div>

          {iqMetrics.map((metric, i) => (
            <div key={metric.label} className={i < iqMetrics.length - 1 ? 'mb-2' : ''}>
              <div className="flex justify-between font-body text-[10px] text-text-muted mb-1">
                {metric.label} <span className="text-text-secondary">{metric.value}%</span>
              </div>
              <div className="h-[3px] bg-border-default rounded-sm overflow-hidden">
                <motion.div
                  className="h-full rounded-sm"
                  style={{ background: metric.color || '#00FF9C' }}
                  initial={{ width: 0 }}
                  animate={{ width: `${metric.value}%` }}
                  transition={{ duration: 1, ease: 'easeOut', delay: 0.3 + i * 0.15 }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Memory Report */}
        <div className="bg-bg-surface-2 border border-border-default rounded-lg p-3.5">
          <div className="font-display text-[11px] font-semibold tracking-wider uppercase text-text-muted mb-3">
            Today's Memory Report
          </div>

          {/* New */}
          <div className="mb-2.5">
            <div className={`font-body text-[9px] tracking-wider uppercase mb-1.5 flex items-center gap-1.5 ${memTypeConfig.new.className}`}>
              New Memories (Yesterday)
            </div>
            {newMems.map((mem, i) => (
              <div key={i} className={`font-body text-[10px] text-text-secondary px-2 py-1.5 border-l-2 mb-1 leading-relaxed ${memTypeConfig.new.itemClass}`}>
                {mem.text}
              </div>
            ))}
          </div>

          {/* Connections */}
          <div className="mb-2.5">
            <div className={`font-body text-[9px] tracking-wider uppercase mb-1.5 flex items-center gap-1.5 ${memTypeConfig.connection.className}`}>
              Connections Made
            </div>
            {connections.map((mem, i) => (
              <div key={i} className={`font-body text-[10px] text-text-secondary px-2 py-1.5 border-l-2 mb-1 leading-relaxed ${memTypeConfig.connection.itemClass}`}>
                {mem.text}
              </div>
            ))}
          </div>

          {/* Flagged */}
          <div>
            <div className={`font-body text-[9px] tracking-wider uppercase mb-1.5 flex items-center gap-1.5 ${memTypeConfig.flagged.className}`}>
              Flagged for Review
            </div>
            {flagged.map((mem, i) => (
              <div key={i} className={`font-body text-[10px] text-text-secondary px-2 py-1.5 border-l-2 mb-1 leading-relaxed ${memTypeConfig.flagged.itemClass}`}>
                {mem.text}
              </div>
            ))}
          </div>
        </div>

        {/* Memory Health */}
        <div className="bg-bg-surface-2 border border-border-default rounded-lg p-3.5">
          <div className="font-display text-[11px] font-semibold tracking-wider uppercase text-text-muted mb-3">
            Memory Health
          </div>
          {[
            { label: 'Total Memories', value: '1,247', color: '' },
            { label: 'Confidence Avg', value: '87%', color: 'text-mint' },
            { label: 'Connections Mapped', value: '43', color: '' },
            { label: 'Predictive Triggers', value: '7 active', color: 'text-violet' },
            { label: 'Memory Scope', value: 'VybeKoderz', color: '' },
          ].map((stat, i, arr) => (
            <div
              key={stat.label}
              className={`flex justify-between font-body text-[10px] text-text-muted py-1.5 ${
                i < arr.length - 1 ? 'mb-1.5 pb-1.5 border-b border-border-default' : ''
              }`}
            >
              {stat.label}
              <span className={stat.color || 'text-text-primary'}>{stat.value}</span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
