# StrongLifts 5×5 Tracker

A local-first, single-user StrongLifts 5×5 workout tracker built with Vite + React + TypeScript + Tailwind CSS. Designed for "zero thinking" gym logging — tap Hit or Miss on your sets and the app handles everything else.

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Deploy to Vercel

```bash
# Option 1: Vercel CLI
npx vercel

# Option 2: Connect GitHub repo to Vercel dashboard
# Build command: npm run build
# Output directory: dist
```

The included `vercel.json` rewrites all routes to `index.html` so client-side routing works on refresh.

## Features

- **Zero-thinking logging**: Pre-filled weights, one-tap "Hit All Sets", auto-progress
- **Offline PWA**: Works without internet after first load (service worker + manifest)
- **Local-first**: All data stays on-device via IndexedDB + localStorage
- **Auto-save**: Draft sessions saved after every interaction
- **Export/Import**: Full JSON backup and restore in Settings

## Program

### Workout A
| Exercise | Sets × Reps |
|----------|-------------|
| Squat | 3 × 5 |
| Bench Press | 3 × 5 |
| Deadlift | 1 × 5 |

### Workout B
| Exercise | Sets × Reps |
|----------|-------------|
| Squat | 3 × 5 |
| Overhead Press | 3 × 5 |
| Power Clean | 5 × 3 |

Power Clean can be swapped for Barbell Row (3×5) in Settings.

## A/B Alternation

Workouts alternate A → B → A → B on a Mon/Wed/Fri schedule:

- If your last completed workout was **A**, the next session is **B**
- If your last completed workout was **B**, the next session is **A**
- First workout ever defaults to **A**

The app shows which type is next. You can start a workout any day.

## Progression Rules

1. **All sets hit** → Increase that lift's working weight by its increment next time it appears
2. **Any set missed** → Repeat the same weight next time
3. **Two consecutive sessions missed** → Deload recommended; one tap applies −10% (configurable)

Default increments: 5 lb for upper body lifts, 10 lb for deadlift. All configurable, supports microloading (2.5 lb plates).

## Data Model

```typescript
type Exercise = 'squat' | 'bench' | 'deadlift' | 'press' | 'powerClean' | 'barbellRow';
type WorkoutType = 'A' | 'B';
type SetStatus = 'pending' | 'hit' | 'miss';

interface WorkoutSet {
  targetReps: number;
  weight: number;
  status: SetStatus;
}

interface ExerciseEntry {
  exercise: Exercise;
  sets: WorkoutSet[];
}

interface WorkoutSession {
  id: string;
  date: string;       // YYYY-MM-DD
  type: WorkoutType;
  exercises: ExerciseEntry[];
  completed: boolean;
  startedAt: number;   // timestamp
  completedAt?: number;
}

interface Settings {
  workingWeights: Record<Exercise, number>;
  increments: Record<Exercise, number>;
  restTimerSeconds: number;
  units: 'lb' | 'kg';
  useBarbelRow: boolean;
  deloadPercent: number;
}
```

### Persistence

| Data | Storage | Reason |
|------|---------|--------|
| Settings | `localStorage` | Small, read on every render |
| Workout history | IndexedDB (via `idb-keyval`) | Larger dataset, async-safe |
| Draft session | IndexedDB (via `idb-keyval`) | Survives tab close mid-workout |

## Tabs

| Tab | Purpose |
|-----|---------|
| **Workout** | Start/resume session, tap set bubbles (Hit/Miss), rest timer, finish workout |
| **Warmup** | Auto-generated warmup ramp sets for current workout (not logged) |
| **Progress** | Per-lift line chart of working weight over time |
| **History** | Calendar view with training day markers + full workout list |
| **Settings** | Starting weights, increments, rest timer, units, exercise substitution, export/import |

## Tech Stack

- **Vite** — build tool
- **React 18** — UI
- **TypeScript** — type safety
- **Tailwind CSS 3** — styling
- **idb-keyval** — IndexedDB wrapper
- **Recharts** — progress charts
- **Service Worker** — offline support
