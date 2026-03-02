import type { WorkoutSession, Settings } from '../types';
import { EXERCISE_LABELS } from '../types';
import { generateWarmup, nextWorkoutType, buildSession } from '../logic';

interface Props {
  settings: Settings;
  draft: WorkoutSession | null;
  history: WorkoutSession[];
}

export function WarmupTab({ settings, draft, history }: Props) {
  // Show warmup for current or next workout
  const session =
    draft ??
    buildSession(nextWorkoutType(history), settings, history);

  return (
    <div className="tab-content">
      <h2 className="text-xl font-bold mb-1">Warmup Sets</h2>
      <p className="text-xs text-gray-400 mb-4">
        Workout {session.type} &middot; Not logged, just follow along
      </p>

      {session.exercises.map((entry, i) => {
        const workWeight = entry.sets[0].weight;
        const warmups = generateWarmup(workWeight, settings.units);

        return (
          <div key={i} className="mb-6">
            <h3 className="font-bold text-base mb-2">{EXERCISE_LABELS[entry.exercise]}</h3>
            <p className="text-xs text-gray-400 mb-2">
              Work sets: {entry.sets[0].weight} {settings.units}
            </p>

            <div className="space-y-1.5">
              {warmups.map((w, wi) => (
                <div
                  key={wi}
                  className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2"
                >
                  <span className="w-20 text-sm font-mono font-medium text-gray-700">
                    {w.weight} {settings.units}
                  </span>
                  <span className="text-sm text-gray-500">
                    {w.sets} &times; {w.reps} reps
                  </span>
                  <div className="flex-1" />
                  <span className="text-xs text-gray-300">warmup</span>
                </div>
              ))}
              {/* Work sets indicator */}
              <div className="flex items-center gap-3 bg-brand-50 border border-brand-100 rounded-lg px-3 py-2">
                <span className="w-20 text-sm font-mono font-bold text-brand-700">
                  {workWeight} {settings.units}
                </span>
                <span className="text-sm text-brand-600 font-medium">
                  {entry.sets.length} &times; {entry.sets[0].targetReps} reps
                </span>
                <div className="flex-1" />
                <span className="text-xs text-brand-400 font-medium">work</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
