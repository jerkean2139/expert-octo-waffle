import LeftRail from './components/LeftRail';
import TopBar from './components/TopBar';
import DonnaHero from './components/DonnaHero';
import DeptAgents from './components/DeptAgents';
import TaskCard from './components/TaskCard';
import VoiceBar from './components/VoiceBar';
import MemoryPanel from './components/MemoryPanel';
import { tasks } from './data/mockData';

function App() {
  return (
    <div className="flex h-screen w-screen">
      {/* Left Rail */}
      <LeftRail />

      {/* Main Canvas */}
      <main className="flex-1 flex flex-col overflow-hidden bg-bg-base">
        <TopBar />

        {/* Scrollable canvas */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
          <DonnaHero />
          <DeptAgents />

          {/* Active Tasks */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="font-display text-[11px] font-semibold tracking-widest uppercase text-text-muted">
                Active Tasks
              </div>
              <div className="font-body text-[11px] text-text-muted bg-bg-surface-2 border border-border-default rounded-full px-2 py-0.5">
                14 total
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {tasks.map((task, i) => (
                <TaskCard key={task.id} task={task} index={i} />
              ))}
            </div>
          </div>
        </div>

        <VoiceBar />
      </main>

      {/* Right Panel */}
      <MemoryPanel />
    </div>
  );
}

export default App;
