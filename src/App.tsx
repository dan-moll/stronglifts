import { useState } from 'react';
import { useSettings } from './hooks/useSettings';
import { useWorkouts } from './hooks/useWorkouts';
import { TabBar } from './components/TabBar';
import { WorkoutTab } from './components/WorkoutTab';
import { WarmupTab } from './components/WarmupTab';
import { ProgressTab } from './components/ProgressTab';
import { HistoryTab } from './components/HistoryTab';
import { SettingsTab } from './components/SettingsTab';

export type Tab = 'workout' | 'warmup' | 'progress' | 'history' | 'settings';

export default function App() {
  const [tab, setTab] = useState<Tab>('workout');
  const { settings, updateSettings } = useSettings();
  const workouts = useWorkouts(settings, updateSettings);

  if (workouts.loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-brand-600 text-xl font-bold animate-pulse">
          StrongLifts
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-brand-600 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <h1 className="text-lg font-bold tracking-tight">StrongLifts 5×5</h1>
        <span className="text-xs opacity-75">{settings.units.toUpperCase()}</span>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        {tab === 'workout' && (
          <WorkoutTab
            settings={settings}
            draft={workouts.draft}
            history={workouts.history}
            startNewSession={workouts.startNewSession}
            updateDraft={workouts.updateDraft}
            finishWorkout={workouts.finishWorkout}
            discardDraft={workouts.discardDraft}
          />
        )}
        {tab === 'warmup' && (
          <WarmupTab
            settings={settings}
            draft={workouts.draft}
            history={workouts.history}
          />
        )}
        {tab === 'progress' && (
          <ProgressTab
            history={workouts.history}
            settings={settings}
          />
        )}
        {tab === 'history' && (
          <HistoryTab
            history={workouts.history}
            settings={settings}
            removeWorkout={workouts.removeWorkout}
          />
        )}
        {tab === 'settings' && (
          <SettingsTab
            settings={settings}
            updateSettings={updateSettings}
            reloadHistory={workouts.reloadHistory}
          />
        )}
      </main>

      {/* Tab bar */}
      <TabBar active={tab} onChange={setTab} />
    </div>
  );
}
