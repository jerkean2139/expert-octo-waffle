import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import type { DepartmentId } from '../data/mockData';

interface RoutingLine {
  id: string;
  from: DepartmentId;
  to: DepartmentId;
  color: string;
  phase: 1 | 2;
}

export default function RoutingAnimation() {
  const [lines, setLines] = useState<RoutingLine[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const targets: DepartmentId[] = ['sales', 'ops', 'marketing', 'dev'];
      const target = targets[Math.floor(Math.random() * targets.length)];
      const id = `route-${Date.now()}`;

      // Phase 1: Donna → department (cyan)
      setLines((prev) => [...prev, { id: `${id}-1`, from: 'donna', to: target, color: 'var(--cyan)', phase: 1 }]);

      // Phase 2: department → specialist (violet), delayed
      setTimeout(() => {
        setLines((prev) => [...prev, { id: `${id}-2`, from: target, to: target, color: 'var(--violet)', phase: 2 }]);
      }, 600);

      // Clean up
      setTimeout(() => {
        setLines((prev) => prev.filter((l) => !l.id.startsWith(id)));
      }, 1500);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
      <AnimatePresence>
        {lines.map((line) => (
          <motion.div
            key={line.id}
            className="absolute left-0 top-0 w-full h-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <svg className="w-full h-full" style={{ position: 'absolute' }}>
              <motion.line
                x1={line.phase === 1 ? '36' : '36'}
                y1={line.phase === 1 ? '80' : '140'}
                x2={line.phase === 1 ? '140' : '220'}
                y2={line.phase === 1 ? '140' : '140'}
                stroke={line.color}
                strokeWidth={2}
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0.8 }}
                animate={{ pathLength: 1, opacity: [0.8, 1, 0] }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                filter="url(#glow)"
              />
              <defs>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
            </svg>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
