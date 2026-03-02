import { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { WorkoutSession, Exercise, Settings } from '../types';
import { EXERCISE_LABELS } from '../types';

const ALL_EXERCISES: Exercise[] = [
  'squat',
  'bench',
  'deadlift',
  'press',
  'powerClean',
  'barbellRow',
];

const COLORS: Record<Exercise, string> = {
  squat: '#dc2626',
  bench: '#2563eb',
  deadlift: '#16a34a',
  press: '#9333ea',
  powerClean: '#ea580c',
  barbellRow: '#0d9488',
};

interface Props {
  history: WorkoutSession[];
  settings: Settings;
}

export function ProgressTab({ history, settings }: Props) {
  const [selected, setSelected] = useState<Exercise | 'all'>('all');

  const completed = useMemo(
    () => history.filter((w) => w.completed),
    [history]
  );

  // Build chart data: each completed session date + weight per exercise
  const chartData = useMemo(() => {
    return completed.map((w) => {
      const point: Record<string, string | number> = { date: w.date };
      for (const entry of w.exercises) {
        point[entry.exercise] = entry.sets[0].weight;
      }
      return point;
    });
  }, [completed]);

  const exercisesToShow =
    selected === 'all'
      ? ALL_EXERCISES.filter((ex) =>
          completed.some((w) => w.exercises.some((e) => e.exercise === ex))
        )
      : [selected];

  if (completed.length === 0) {
    return (
      <div className="tab-content flex flex-col items-center justify-center pt-20">
        <p className="text-gray-400 text-sm">Complete a workout to see progress</p>
      </div>
    );
  }

  return (
    <div className="tab-content">
      <h2 className="text-xl font-bold mb-3">Progress</h2>

      {/* Filter pills */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-4 -mx-1 px-1">
        <FilterPill
          label="All"
          active={selected === 'all'}
          onClick={() => setSelected('all')}
        />
        {ALL_EXERCISES.filter((ex) =>
          completed.some((w) => w.exercises.some((e) => e.exercise === ex))
        ).map((ex) => (
          <FilterPill
            key={ex}
            label={EXERCISE_LABELS[ex]}
            active={selected === ex}
            onClick={() => setSelected(ex)}
            color={COLORS[ex]}
          />
        ))}
      </div>

      {/* Chart */}
      <div className="bg-gray-50 rounded-xl p-2 mb-4" style={{ height: 280 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: '#9ca3af' }}
              tickFormatter={(v: string) => v.slice(5)}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#9ca3af' }}
              width={40}
              domain={['auto', 'auto']}
            />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
              labelFormatter={(label: string) => label}
            />
            {exercisesToShow.map((ex) => (
              <Line
                key={ex}
                type="monotone"
                dataKey={ex}
                stroke={COLORS[ex]}
                strokeWidth={2}
                dot={{ r: 3 }}
                name={EXERCISE_LABELS[ex]}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Current working weights summary */}
      <h3 className="font-bold text-sm text-gray-500 mb-2">Current Working Weights</h3>
      <div className="space-y-1.5">
        {ALL_EXERCISES.map((ex) => (
          <div
            key={ex}
            className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2"
          >
            <span className="text-sm font-medium">{EXERCISE_LABELS[ex]}</span>
            <span className="text-sm font-mono font-bold" style={{ color: COLORS[ex] }}>
              {settings.workingWeights[ex]} {settings.units}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FilterPill({
  label,
  active,
  onClick,
  color,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  color?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`whitespace-nowrap px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
        active
          ? 'text-white border-transparent'
          : 'text-gray-500 border-gray-200 bg-white'
      }`}
      style={
        active
          ? { backgroundColor: color ?? '#dc2626', borderColor: color ?? '#dc2626' }
          : undefined
      }
    >
      {label}
    </button>
  );
}
