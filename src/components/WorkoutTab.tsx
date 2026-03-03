import { useCallback } from 'react';
import type { WorkoutSession, Settings, SetStatus, Exercise } from '../types';
import { EXERCISE_LABELS } from '../types';
import { nextWorkoutType, consecutiveMissCount, deloadWeight, isTrainingDay } from '../logic';
import { useTimer } from '../hooks/useTimer';

interface Props {
  settings: Settings;
  draft: WorkoutSession | null;
  history: WorkoutSession[];
  startNewSession: () => void;
  updateDraft: (fn: (prev: WorkoutSession) => WorkoutSession) => void;
  finishWorkout: () => void;
  discardDraft: () => void;
}

export function WorkoutTab({
  settings,
  draft,
  history,
  startNewSession,
  updateDraft,
  finishWorkout,
  discardDraft,
}: Props) {
  const timer = useTimer(settings.restTimerSeconds);

  const toggleSet = useCallback(
    (exIdx: number, setIdx: number) => {
      updateDraft((prev) => {
        const exercises = prev.exercises.map((e, ei) => {
          if (ei !== exIdx) return e;
          const sets = e.sets.map((s, si) => {
            if (si !== setIdx) return s;
            const next: SetStatus =
              s.status === 'pending' ? 'hit' : s.status === 'hit' ? 'miss' : 'pending';
            return { ...s, status: next };
          });
          return { ...e, sets };
        });
        return { ...prev, exercises };
      });
      // Auto-start rest timer
      timer.start();
    },
    [updateDraft, timer]
  );

  const hitAllSets = useCallback(
    (exIdx: number) => {
      updateDraft((prev) => {
        const exercises = prev.exercises.map((e, ei) => {
          if (ei !== exIdx) return e;
          const sets = e.sets.map((s) =>
            s.status === 'pending' ? { ...s, status: 'hit' as const } : s
          );
          return { ...e, sets };
        });
        return { ...prev, exercises };
      });
    },
    [updateDraft]
  );

  const allDone =
    draft?.exercises.every((e) => e.sets.every((s) => s.status !== 'pending')) ?? false;

  // No active draft
  if (!draft) {
    const nextType = nextWorkoutType(history);
    const dayLabel = isTrainingDay() ? "Today's" : 'Next';

    return (
      <div className="fixed inset-0 top-[3.25rem] bottom-[4rem] flex flex-col items-center justify-center gap-6 px-6 overflow-hidden">
        <div className="text-center">
          <div className="text-6xl font-black text-brand-600 mb-2">{nextType}</div>
          <p className="text-gray-500 text-sm">
            {dayLabel} Workout &middot; Workout {nextType}
          </p>
        </div>

        {/* Deload warnings */}
        {(['squat', 'bench', 'deadlift', 'press', 'powerClean', 'barbellRow'] as Exercise[]).map(
          (ex) => {
            const misses = consecutiveMissCount(ex, history);
            if (misses < 2) return null;
            const currentWeight = settings.workingWeights[ex];
            const deloaded = deloadWeight(currentWeight, settings.deloadPercent, settings.units);
            return (
              <div
                key={ex}
                className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 w-full text-sm"
              >
                <span className="font-semibold text-yellow-800">Deload recommended</span>
                <span className="text-yellow-700">
                  {' '}&mdash; {EXERCISE_LABELS[ex]}: {currentWeight} &rarr; {deloaded}{' '}
                  {settings.units}
                </span>
              </div>
            );
          }
        )}

        <button
          onClick={startNewSession}
          className="bg-brand-600 text-white font-bold text-lg px-10 py-4 rounded-xl shadow-lg active:bg-brand-700 transition-colors"
        >
          Start Workout {nextType}
        </button>
      </div>
    );
  }

  // Active session
  return (
    <div className="tab-content">
      {/* Session header */}
      <div className="flex items-center justify-between mb-5 mt-2">
        <div>
          <h2 className="text-2xl font-extrabold">
            Workout {draft.type}
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">{draft.date}</p>
        </div>
        <button
          onClick={discardDraft}
          className="text-xs text-gray-400 border border-gray-200 px-3 py-1.5 rounded-lg"
        >
          Discard
        </button>
      </div>

      {/* Rest timer */}
      {timer.running && (
        <div className="bg-brand-50 border border-brand-200 rounded-xl p-4 mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-brand-600 font-medium">Rest Timer</p>
            <p className="text-3xl font-mono font-bold text-brand-700">
              {Math.floor(timer.remaining / 60)}:{String(timer.remaining % 60).padStart(2, '0')}
            </p>
          </div>
          <button
            onClick={timer.stop}
            className="text-brand-600 text-sm font-medium border border-brand-200 px-3 py-1.5 rounded-lg"
          >
            Skip
          </button>
        </div>
      )}

      {/* Exercise cards */}
      {draft.exercises.map((entry, exIdx) => {
        const allHit = entry.sets.every((s) => s.status === 'hit');
        const hasPending = entry.sets.some((s) => s.status === 'pending');

        return (
          <div
            key={exIdx}
            className={`rounded-2xl border mb-5 overflow-hidden shadow-sm ${
              allHit ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-white'
            }`}
          >
            {/* Exercise header */}
            <div className="px-5 pt-4 pb-2 flex items-start justify-between">
              <div>
                <h3 className="font-extrabold text-lg">{EXERCISE_LABELS[entry.exercise]}</h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  <span className="font-semibold text-gray-700">
                    {entry.sets[0].weight} {settings.units}
                  </span>
                  {' '}&middot; {entry.sets.length}&times;{entry.sets[0].targetReps}
                </p>
              </div>
              {hasPending && (
                <button
                  onClick={() => hitAllSets(exIdx)}
                  className="bg-green-500 text-white text-sm font-bold px-4 py-2 rounded-xl active:bg-green-600"
                >
                  Hit All
                </button>
              )}
              {allHit && (
                <span className="text-green-600 text-sm font-bold mt-1">Complete</span>
              )}
            </div>

            {/* Set bubbles */}
            <div className="px-5 pb-5 pt-1 flex gap-4">
              {entry.sets.map((s, si) => (
                <button
                  key={si}
                  onClick={() => toggleSet(exIdx, si)}
                  className={`w-16 h-16 rounded-full flex items-center justify-center text-base font-bold border-[3px] transition-all active:scale-95 ${
                    s.status === 'hit'
                      ? 'bg-green-500 border-green-500 text-white shadow-md shadow-green-200'
                      : s.status === 'miss'
                      ? 'bg-brand-600 border-brand-600 text-white shadow-md shadow-red-200'
                      : 'bg-gray-100 border-gray-300 text-gray-500'
                  }`}
                >
                  {s.status === 'pending'
                    ? s.targetReps
                    : s.status === 'hit'
                    ? '\u2713'
                    : '\u2717'}
                </button>
              ))}
            </div>
          </div>
        );
      })}

      {/* Finish button */}
      <button
        onClick={finishWorkout}
        disabled={!allDone}
        className={`w-full py-4 rounded-xl font-bold text-lg mt-2 transition-colors ${
          allDone
            ? 'bg-brand-600 text-white active:bg-brand-700 shadow-lg'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
        }`}
      >
        Finish Workout
      </button>
    </div>
  );
}
