import { motion } from 'framer-motion';
import { deptColorMap, statusConfig, type Task } from '../data/mockData';

interface TaskCardProps {
  task: Task;
  isActive?: boolean;
}

export default function TaskCard({ task, isActive = false }: TaskCardProps) {
  const borderColor = deptColorMap[task.department];
  const { color: statusColor, label: statusLabel } = statusConfig[task.status];

  return (
    <motion.div
      className="relative rounded-lg overflow-hidden cursor-pointer"
      style={{
        background: 'var(--bg-elevated)',
        borderLeft: `3px solid ${borderColor}`,
        borderTop: '1px solid var(--border-subtle)',
        borderRight: '1px solid var(--border-subtle)',
        borderBottom: '1px solid var(--border-subtle)',
      }}
      whileHover={{
        y: -2,
        borderColor: borderColor,
        boxShadow: `0 4px 20px ${borderColor}22`,
      }}
      transition={{ duration: 0.2 }}
    >
      {isActive && (
        <motion.div
          className="absolute inset-0 rounded-lg pointer-events-none"
          style={{ border: `1px solid ${borderColor}` }}
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
      <div className="p-4">
        {/* Header row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {/* Small agent avatar */}
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
              style={{
                background: `${borderColor}22`,
                color: borderColor,
                fontFamily: 'var(--font-display)',
              }}
            >
              {task.agentName[0]}
            </div>
            <span className="text-xs" style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
              {task.agentName}
            </span>
          </div>
          {/* Status chip */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs" style={{ background: `${statusColor}15`, fontFamily: 'var(--font-mono)' }}>
            <motion.div
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: statusColor }}
              animate={task.status === 'running' ? { opacity: [1, 0.4, 1] } : {}}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <span style={{ color: statusColor }}>{statusLabel}</span>
          </div>
        </div>

        {/* Title */}
        <h3
          className="text-sm font-medium mb-3 leading-snug"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
        >
          {task.title}
        </h3>

        {/* Progress bar */}
        <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: borderColor }}
            initial={{ width: 0 }}
            animate={{ width: `${task.progress}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>
        <div className="text-right mt-1">
          <span className="text-xs" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
            {task.progress}%
          </span>
        </div>
      </div>
    </motion.div>
  );
}
