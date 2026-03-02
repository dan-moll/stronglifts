import type {
  Exercise,
  WorkoutType,
  WorkoutSession,
  ExerciseEntry,
  WorkoutSet,
  Settings,
  WarmupSet,
} from './types';
import { BAR_WEIGHT } from './types';

// ---------- Program definition ----------

interface ProgramExercise {
  exercise: Exercise;
  sets: number;
  reps: number;
}

function getProgram(type: WorkoutType, useBarbelRow: boolean): ProgramExercise[] {
  if (type === 'A') {
    return [
      { exercise: 'squat', sets: 3, reps: 5 },
      { exercise: 'bench', sets: 3, reps: 5 },
      { exercise: 'deadlift', sets: 1, reps: 5 },
    ];
  }
  const thirdLift: ProgramExercise = useBarbelRow
    ? { exercise: 'barbellRow', sets: 3, reps: 5 }
    : { exercise: 'powerClean', sets: 5, reps: 3 };
  return [
    { exercise: 'squat', sets: 3, reps: 5 },
    { exercise: 'press', sets: 3, reps: 5 },
    thirdLift,
  ];
}

// ---------- A/B alternation ----------

export function nextWorkoutType(history: WorkoutSession[]): WorkoutType {
  const completed = history.filter((w) => w.completed);
  if (completed.length === 0) return 'A';
  const last = completed[completed.length - 1];
  return last.type === 'A' ? 'B' : 'A';
}

// ---------- Build a new session ----------

let idCounter = 0;
function uid(): string {
  return `${Date.now()}_${++idCounter}_${Math.random().toString(36).slice(2, 8)}`;
}

export function buildSession(
  type: WorkoutType,
  settings: Settings,
  history: WorkoutSession[],
): WorkoutSession {
  const program = getProgram(type, settings.useBarbelRow);
  const exercises: ExerciseEntry[] = program.map((p) => {
    const weight = computeWorkingWeight(p.exercise, settings, history);
    const sets: WorkoutSet[] = Array.from({ length: p.sets }, () => ({
      targetReps: p.reps,
      weight,
      status: 'pending' as const,
    }));
    return { exercise: p.exercise, sets };
  });

  const today = new Date().toISOString().slice(0, 10);
  return {
    id: uid(),
    date: today,
    type,
    exercises,
    completed: false,
    startedAt: Date.now(),
  };
}

// ---------- Working weight computation ----------

function computeWorkingWeight(
  exercise: Exercise,
  settings: Settings,
  history: WorkoutSession[],
): number {
  const completed = history.filter((w) => w.completed);
  // Find last session that contained this exercise
  const lastWithExercise = [...completed]
    .reverse()
    .find((w) => w.exercises.some((e) => e.exercise === exercise));

  if (!lastWithExercise) {
    return settings.workingWeights[exercise];
  }

  const entry = lastWithExercise.exercises.find((e) => e.exercise === exercise)!;
  const allHit = entry.sets.every((s) => s.status === 'hit');
  const lastWeight = entry.sets[0].weight;

  if (allHit) {
    return lastWeight + settings.increments[exercise];
  }
  return lastWeight; // repeat
}

// ---------- Consecutive-miss detection ----------

export function consecutiveMissCount(
  exercise: Exercise,
  history: WorkoutSession[],
): number {
  const completed = history.filter((w) => w.completed);
  let count = 0;
  for (let i = completed.length - 1; i >= 0; i--) {
    const entry = completed[i].exercises.find((e) => e.exercise === exercise);
    if (!entry) continue;
    const hasMiss = entry.sets.some((s) => s.status === 'miss');
    if (hasMiss) {
      count++;
    } else {
      break;
    }
  }
  return count;
}

export function deloadWeight(
  currentWeight: number,
  deloadPercent: number,
  units: 'lb' | 'kg',
): number {
  const reduced = currentWeight * (1 - deloadPercent / 100);
  const step = units === 'lb' ? 5 : 2.5;
  return Math.max(BAR_WEIGHT[units], Math.round(reduced / step) * step);
}

// ---------- Apply progression after finishing ----------

export function applyProgression(
  session: WorkoutSession,
  settings: Settings,
): Settings {
  const updated = { ...settings, workingWeights: { ...settings.workingWeights } };
  for (const entry of session.exercises) {
    const allHit = entry.sets.every((s) => s.status === 'hit');
    if (allHit) {
      updated.workingWeights[entry.exercise] =
        entry.sets[0].weight + settings.increments[entry.exercise];
    }
    // If missed, working weight stays the same (no change needed since
    // computeWorkingWeight reads from history)
  }
  return updated;
}

// ---------- Warmup generation ----------

export function generateWarmup(
  workWeight: number,
  units: 'lb' | 'kg',
): WarmupSet[] {
  const bar = BAR_WEIGHT[units];
  const step = units === 'lb' ? 5 : 2.5;
  const round = (n: number) => Math.max(bar, Math.round(n / step) * step);

  if (workWeight <= bar) {
    return [{ weight: bar, reps: 5, sets: 2 }];
  }

  const warmups: WarmupSet[] = [{ weight: bar, reps: 5, sets: 2 }];

  const pcts = [0.4, 0.6, 0.8];
  const reps = [5, 3, 2];
  for (let i = 0; i < pcts.length; i++) {
    const w = round(workWeight * pcts[i]);
    if (w > bar && w < workWeight) {
      // Deduplicate: skip if same as previous entry
      if (warmups.length === 0 || warmups[warmups.length - 1].weight !== w) {
        warmups.push({ weight: w, reps: reps[i], sets: 1 });
      }
    }
  }

  return warmups;
}

// ---------- Schedule helpers ----------

export function nextTrainingDay(): Date {
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 1=Mon, ...
  // M=1, W=3, F=5
  const trainingDays = [1, 3, 5];
  for (const td of trainingDays) {
    if (day <= td) {
      const diff = td - day;
      const d = new Date(now);
      d.setDate(d.getDate() + diff);
      return d;
    }
  }
  // Past Friday, next Monday
  const d = new Date(now);
  d.setDate(d.getDate() + (8 - day));
  return d;
}

export function isTrainingDay(): boolean {
  const day = new Date().getDay();
  return day === 1 || day === 3 || day === 5;
}
