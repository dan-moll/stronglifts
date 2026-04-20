export type Exercise =
  | 'squat'
  | 'bench'
  | 'deadlift'
  | 'press'
  | 'powerClean'
  | 'barbellRow'
  | 'chinUp';

export type WorkoutType = 'A' | 'B';
export type SetStatus = 'pending' | 'hit' | 'miss';

export interface WorkoutSet {
  targetReps: number;
  weight: number;
  status: SetStatus;
}

export interface ExerciseEntry {
  exercise: Exercise;
  sets: WorkoutSet[];
}

export interface WorkoutSession {
  id: string;
  date: string; // YYYY-MM-DD
  type: WorkoutType;
  exercises: ExerciseEntry[];
  completed: boolean;
  startedAt: number;
  completedAt?: number;
}

export interface ProgramExercise {
  exercise: Exercise;
  sets: number;
  reps: number;
}

export interface Settings {
  workingWeights: Record<Exercise, number>;
  increments: Record<Exercise, number>;
  restTimerSeconds: number;
  units: 'lb' | 'kg';
  useBarbelRow: boolean;
  deloadPercent: number;
  programA: ProgramExercise[];
  programB: ProgramExercise[];
}

export interface WarmupSet {
  weight: number;
  reps: number;
  sets: number;
}

export const EXERCISE_LABELS: Record<Exercise, string> = {
  squat: 'Squat',
  bench: 'Bench Press',
  deadlift: 'Deadlift',
  press: 'Overhead Press',
  powerClean: 'Power Clean',
  barbellRow: 'Barbell Row',
  chinUp: 'Chin-ups',
};

export const BODYWEIGHT_EXERCISES = new Set<Exercise>(['chinUp']);

export const ALL_EXERCISES: Exercise[] = [
  'squat',
  'bench',
  'deadlift',
  'press',
  'powerClean',
  'barbellRow',
  'chinUp',
];

export const DEFAULT_SETTINGS: Settings = {
  workingWeights: {
    squat: 45,
    bench: 45,
    deadlift: 135,
    press: 45,
    powerClean: 95,
    barbellRow: 65,
    chinUp: 0,
  },
  increments: {
    squat: 5,
    bench: 5,
    deadlift: 10,
    press: 5,
    powerClean: 5,
    barbellRow: 5,
    chinUp: 0,
  },
  restTimerSeconds: 90,
  units: 'lb',
  useBarbelRow: false,
  deloadPercent: 10,
  programA: [
    { exercise: 'squat', sets: 3, reps: 5 },
    { exercise: 'bench', sets: 3, reps: 5 },
    { exercise: 'chinUp', sets: 3, reps: 5 },
  ],
  programB: [
    { exercise: 'squat', sets: 3, reps: 5 },
    { exercise: 'deadlift', sets: 1, reps: 5 },
  ],
};

export const BAR_WEIGHT: Record<'lb' | 'kg', number> = { lb: 45, kg: 20 };
