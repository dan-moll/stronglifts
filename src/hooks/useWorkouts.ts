import { useState, useEffect, useCallback } from 'react';
import {
  getAllWorkouts,
  saveWorkout,
  saveDraft,
  loadDraft,
  clearDraft,
  deleteWorkout,
} from '../db';
import type { WorkoutSession, Settings } from '../types';
import { nextWorkoutType, buildSession, applyProgression } from '../logic';

export function useWorkouts(settings: Settings, updateSettings: (p: Partial<Settings>) => void) {
  const [history, setHistory] = useState<WorkoutSession[]>([]);
  const [draft, setDraft] = useState<WorkoutSession | null>(null);
  const [loading, setLoading] = useState(true);

  // Load history + draft on mount
  useEffect(() => {
    (async () => {
      const all = await getAllWorkouts();
      setHistory(all);
      const d = await loadDraft();
      setDraft(d);
      setLoading(false);
    })();
  }, []);

  // Auto-save draft on every change
  useEffect(() => {
    if (draft && !draft.completed) {
      saveDraft(draft);
    }
  }, [draft]);

  const startNewSession = useCallback(() => {
    const type = nextWorkoutType(history);
    const session = buildSession(type, settings, history);
    setDraft(session);
  }, [history, settings]);

  const updateDraft = useCallback((updater: (prev: WorkoutSession) => WorkoutSession) => {
    setDraft((prev) => {
      if (!prev) return prev;
      return updater(prev);
    });
  }, []);

  const finishWorkout = useCallback(async () => {
    if (!draft) return;
    const completed = { ...draft, completed: true, completedAt: Date.now() };
    await saveWorkout(completed);
    await clearDraft();

    // Apply progression
    const updatedSettings = applyProgression(completed, settings);
    updateSettings({ workingWeights: updatedSettings.workingWeights });

    setHistory((prev) => [...prev, completed]);
    setDraft(null);
  }, [draft, settings, updateSettings]);

  const discardDraft = useCallback(async () => {
    await clearDraft();
    setDraft(null);
  }, []);

  const removeWorkout = useCallback(async (id: string) => {
    await deleteWorkout(id);
    setHistory((prev) => prev.filter((w) => w.id !== id));
  }, []);

  const reloadHistory = useCallback(async () => {
    const all = await getAllWorkouts();
    setHistory(all);
  }, []);

  return {
    history,
    draft,
    loading,
    startNewSession,
    updateDraft,
    finishWorkout,
    discardDraft,
    removeWorkout,
    reloadHistory,
  } as const;
}
