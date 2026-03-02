import { get, set, del, keys } from 'idb-keyval';
import type { WorkoutSession, Settings } from './types';
import { DEFAULT_SETTINGS } from './types';

const SETTINGS_KEY = 'sl_settings';
const DRAFT_KEY = 'sl_draft';

// --- Settings (localStorage for speed) ---

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch { /* fall through */ }
  return { ...DEFAULT_SETTINGS };
}

export function saveSettings(s: Settings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

// --- Workouts (IndexedDB via idb-keyval) ---

function workoutKey(id: string) {
  return `workout_${id}`;
}

export async function saveWorkout(w: WorkoutSession): Promise<void> {
  await set(workoutKey(w.id), w);
}

export async function getWorkout(id: string): Promise<WorkoutSession | undefined> {
  return get<WorkoutSession>(workoutKey(id));
}

export async function deleteWorkout(id: string): Promise<void> {
  await del(workoutKey(id));
}

export async function getAllWorkouts(): Promise<WorkoutSession[]> {
  const allKeys = await keys();
  const workoutKeys = allKeys.filter(
    (k) => typeof k === 'string' && k.startsWith('workout_')
  );
  const workouts: WorkoutSession[] = [];
  for (const k of workoutKeys) {
    const w = await get<WorkoutSession>(k as string);
    if (w) workouts.push(w);
  }
  workouts.sort((a, b) => a.startedAt - b.startedAt);
  return workouts;
}

// --- Draft session ---

export async function saveDraft(w: WorkoutSession): Promise<void> {
  await set(DRAFT_KEY, w);
}

export async function loadDraft(): Promise<WorkoutSession | null> {
  const d = await get<WorkoutSession>(DRAFT_KEY);
  return d ?? null;
}

export async function clearDraft(): Promise<void> {
  await del(DRAFT_KEY);
}

// --- Export / Import ---

export async function exportAll(): Promise<string> {
  const workouts = await getAllWorkouts();
  const settings = loadSettings();
  return JSON.stringify({ settings, workouts }, null, 2);
}

export async function importAll(json: string): Promise<void> {
  const data = JSON.parse(json);
  if (data.settings) saveSettings(data.settings);
  if (Array.isArray(data.workouts)) {
    for (const w of data.workouts) {
      await saveWorkout(w);
    }
  }
}
