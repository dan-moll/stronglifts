import { useState, useMemo } from 'react';
import type { WorkoutSession, Settings } from '../types';
import { EXERCISE_LABELS } from '../types';

interface Props {
  history: WorkoutSession[];
  settings: Settings;
  removeWorkout: (id: string) => void;
}

export function HistoryTab({ history, settings, removeWorkout }: Props) {
  const completed = useMemo(
    () => history.filter((w) => w.completed).reverse(),
    [history]
  );

  const [viewMonth, setViewMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Build set of workout dates for calendar
  const workoutDates = useMemo(() => {
    const dates = new Set<string>();
    for (const w of completed) dates.add(w.date);
    return dates;
  }, [completed]);

  // Calendar generation
  const calendarDays = useMemo(() => {
    const { year, month } = viewMonth;
    const first = new Date(year, month, 1);
    const startDay = first.getDay(); // 0=Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days: (number | null)[] = [];
    for (let i = 0; i < startDay; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);
    return days;
  }, [viewMonth]);

  const monthLabel = new Date(viewMonth.year, viewMonth.month).toLocaleString('default', {
    month: 'long',
    year: 'numeric',
  });

  const prevMonth = () =>
    setViewMonth((p) =>
      p.month === 0 ? { year: p.year - 1, month: 11 } : { year: p.year, month: p.month - 1 }
    );
  const nextMonth = () =>
    setViewMonth((p) =>
      p.month === 11 ? { year: p.year + 1, month: 0 } : { year: p.year, month: p.month + 1 }
    );

  const dateStr = (day: number) => {
    const m = String(viewMonth.month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${viewMonth.year}-${m}-${d}`;
  };

  const selectedWorkouts = selectedDate
    ? completed.filter((w) => w.date === selectedDate)
    : [];

  return (
    <div className="tab-content">
      <h2 className="text-xl font-bold mb-3">History</h2>

      {/* Calendar */}
      <div className="bg-gray-50 rounded-xl p-3 mb-4">
        <div className="flex items-center justify-between mb-2">
          <button onClick={prevMonth} className="p-1 text-gray-400">
            &larr;
          </button>
          <span className="text-sm font-semibold">{monthLabel}</span>
          <button onClick={nextMonth} className="p-1 text-gray-400">
            &rarr;
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 text-center text-[10px] text-gray-400 mb-1">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-0.5">
          {calendarDays.map((day, i) => {
            if (day === null) return <div key={i} />;
            const ds = dateStr(day);
            const hasWorkout = workoutDates.has(ds);
            const isSelected = ds === selectedDate;
            return (
              <button
                key={i}
                onClick={() => setSelectedDate(ds === selectedDate ? null : ds)}
                className={`aspect-square flex items-center justify-center rounded-lg text-xs font-medium transition-colors relative ${
                  isSelected
                    ? 'bg-brand-600 text-white'
                    : hasWorkout
                    ? 'text-brand-600 font-bold'
                    : 'text-gray-500'
                }`}
              >
                {day}
                {hasWorkout && !isSelected && (
                  <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-brand-500" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected date detail */}
      {selectedDate && selectedWorkouts.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-500 mb-2">{selectedDate}</h3>
          {selectedWorkouts.map((w) => (
            <WorkoutCard
              key={w.id}
              workout={w}
              settings={settings}
              onRemove={() => removeWorkout(w.id)}
            />
          ))}
        </div>
      )}

      {/* List view */}
      <h3 className="text-sm font-semibold text-gray-500 mb-2">
        All Workouts ({completed.length})
      </h3>
      {completed.length === 0 && (
        <p className="text-gray-400 text-sm py-8 text-center">No workouts yet</p>
      )}
      <div className="space-y-2">
        {completed.map((w) => (
          <WorkoutCard
            key={w.id}
            workout={w}
            settings={settings}
            onRemove={() => removeWorkout(w.id)}
          />
        ))}
      </div>
    </div>
  );
}

function WorkoutCard({
  workout,
  settings,
  onRemove,
}: {
  workout: WorkoutSession;
  settings: Settings;
  onRemove: () => void;
}) {
  const [showDelete, setShowDelete] = useState(false);

  return (
    <div
      className="bg-white border border-gray-200 rounded-xl p-3"
      onClick={() => setShowDelete((v) => !v)}
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span className="bg-brand-100 text-brand-700 text-xs font-bold px-2 py-0.5 rounded">
            {workout.type}
          </span>
          <span className="text-xs text-gray-400">{workout.date}</span>
        </div>
        {showDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="text-xs text-red-400 border border-red-200 px-2 py-0.5 rounded"
          >
            Delete
          </button>
        )}
      </div>
      {workout.exercises.map((entry, i) => {
        const hits = entry.sets.filter((s) => s.status === 'hit').length;
        const total = entry.sets.length;
        return (
          <div key={i} className="flex items-center justify-between text-sm py-0.5">
            <span className="text-gray-700">{EXERCISE_LABELS[entry.exercise]}</span>
            <span className="font-mono text-xs text-gray-500">
              {entry.sets[0].weight} {settings.units} &middot; {hits}/{total}
            </span>
          </div>
        );
      })}
    </div>
  );
}
