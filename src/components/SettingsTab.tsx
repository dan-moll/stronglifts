import { useState, useRef } from 'react';
import type { Settings, Exercise, ProgramExercise } from '../types';
import { EXERCISE_LABELS, DEFAULT_SETTINGS, ALL_EXERCISES, BODYWEIGHT_EXERCISES } from '../types';
import { exportAll, importAll } from '../db';

interface Props {
  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;
  reloadHistory: () => void;
}

export function SettingsTab({ settings, updateSettings, reloadHistory }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState('');

  const setWeight = (ex: Exercise, value: string) => {
    const num = parseFloat(value);
    if (isNaN(num) || num < 0) return;
    updateSettings({ workingWeights: { ...settings.workingWeights, [ex]: num } });
  };

  const setIncrement = (ex: Exercise, value: string) => {
    const num = parseFloat(value);
    if (isNaN(num) || num < 0) return;
    updateSettings({ increments: { ...settings.increments, [ex]: num } });
  };

  const handleExport = async () => {
    const json = await exportAll();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stronglifts-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      await importAll(text);
      setImportStatus('Imported successfully! Reloading...');
      window.location.reload();
    } catch {
      setImportStatus('Import failed. Check file format.');
    }
  };

  // Program editing helpers
  const updateProgram = (workout: 'A' | 'B', next: ProgramExercise[]) => {
    updateSettings(workout === 'A' ? { programA: next } : { programB: next });
  };

  const removeExercise = (workout: 'A' | 'B', idx: number) => {
    const program = workout === 'A' ? [...settings.programA] : [...settings.programB];
    program.splice(idx, 1);
    updateProgram(workout, program);
  };

  const updateExerciseField = (
    workout: 'A' | 'B',
    idx: number,
    field: 'sets' | 'reps',
    raw: string
  ) => {
    const num = parseInt(raw);
    if (isNaN(num) || num < 1) return;
    const program = (workout === 'A' ? [...settings.programA] : [...settings.programB]).map(
      (p, i) => (i === idx ? { ...p, [field]: num } : p)
    );
    updateProgram(workout, program);
  };

  const addExercise = (workout: 'A' | 'B', ex: Exercise) => {
    const program = workout === 'A' ? [...settings.programA] : [...settings.programB];
    program.push({ exercise: ex, sets: 3, reps: 5 });
    updateProgram(workout, program);
  };

  // Working weights — only show exercises that appear in either program
  const activeExercises = Array.from(
    new Set([
      ...settings.programA.map((p) => p.exercise),
      ...settings.programB.map((p) => p.exercise),
    ])
  ).filter((ex) => !BODYWEIGHT_EXERCISES.has(ex));

  return (
    <div className="tab-content">
      <h2 className="text-xl font-bold mb-4">Settings</h2>

      {/* Units */}
      <Section title="Units">
        <div className="flex gap-2">
          {(['lb', 'kg'] as const).map((u) => (
            <button
              key={u}
              onClick={() => updateSettings({ units: u })}
              className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                settings.units === u
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'bg-white text-gray-500 border-gray-200'
              }`}
            >
              {u.toUpperCase()}
            </button>
          ))}
        </div>
      </Section>

      {/* Rest Timer */}
      <Section title="Rest Timer (seconds)">
        <input
          type="number"
          value={settings.restTimerSeconds}
          onChange={(e) =>
            updateSettings({ restTimerSeconds: Math.max(0, parseInt(e.target.value) || 0) })
          }
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
        />
      </Section>

      {/* Deload */}
      <Section title="Deload Percentage">
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={settings.deloadPercent}
            onChange={(e) =>
              updateSettings({
                deloadPercent: Math.max(1, Math.min(50, parseInt(e.target.value) || 10)),
              })
            }
            className="w-20 border border-gray-200 rounded-lg px-3 py-2 text-sm"
          />
          <span className="text-sm text-gray-500">% after 3 consecutive misses</span>
        </div>
      </Section>

      {/* Program A */}
      <ProgramEditor
        label="Workout A"
        program={settings.programA}
        onRemove={(i) => removeExercise('A', i)}
        onFieldChange={(i, f, v) => updateExerciseField('A', i, f, v)}
        onAdd={(ex) => addExercise('A', ex)}
      />

      {/* Program B */}
      <ProgramEditor
        label="Workout B"
        program={settings.programB}
        onRemove={(i) => removeExercise('B', i)}
        onFieldChange={(i, f, v) => updateExerciseField('B', i, f, v)}
        onAdd={(ex) => addExercise('B', ex)}
      />

      {/* Working Weights — only active barbell exercises */}
      {activeExercises.length > 0 && (
        <Section title="Working Weights">
          <div className="space-y-2">
            {activeExercises.map((ex) => (
              <div key={ex} className="flex items-center justify-between">
                <span className="text-sm text-gray-700 w-32">{EXERCISE_LABELS[ex]}</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="2.5"
                    value={settings.workingWeights[ex]}
                    onChange={(e) => setWeight(ex, e.target.value)}
                    className="w-20 border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-right"
                  />
                  <span className="text-xs text-gray-400 w-6">{settings.units}</span>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Increments — only active barbell exercises */}
      {activeExercises.length > 0 && (
        <Section title="Increments">
          <div className="space-y-2">
            {activeExercises.map((ex) => (
              <div key={ex} className="flex items-center justify-between">
                <span className="text-sm text-gray-700 w-32">{EXERCISE_LABELS[ex]}</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="0.5"
                    value={settings.increments[ex]}
                    onChange={(e) => setIncrement(ex, e.target.value)}
                    className="w-20 border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-right"
                  />
                  <span className="text-xs text-gray-400 w-6">{settings.units}</span>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Export / Import */}
      <Section title="Data">
        <div className="space-y-2">
          <button
            onClick={handleExport}
            className="w-full py-2.5 rounded-lg text-sm font-medium border border-gray-200 text-gray-700 active:bg-gray-50"
          >
            Export Backup (JSON)
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full py-2.5 rounded-lg text-sm font-medium border border-gray-200 text-gray-700 active:bg-gray-50"
          >
            Import Backup
          </button>
          <input ref={fileRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
          {importStatus && <p className="text-xs text-center text-gray-500">{importStatus}</p>}
        </div>
      </Section>

      {/* Danger Zone */}
      <Section title="Danger Zone">
        <button
          onClick={() => updateSettings(DEFAULT_SETTINGS)}
          className="w-full py-2.5 rounded-lg text-sm font-medium border border-red-200 text-red-500 active:bg-red-50"
        >
          Reset All Settings to Defaults
        </button>
      </Section>
    </div>
  );
}

function ProgramEditor({
  label,
  program,
  onRemove,
  onFieldChange,
  onAdd,
}: {
  label: string;
  program: ProgramExercise[];
  onRemove: (i: number) => void;
  onFieldChange: (i: number, field: 'sets' | 'reps', value: string) => void;
  onAdd: (ex: Exercise) => void;
}) {
  const [adding, setAdding] = useState(false);
  const inProgram = new Set(program.map((p) => p.exercise));
  const available = ALL_EXERCISES.filter((ex) => !inProgram.has(ex));

  return (
    <Section title={label}>
      <div className="space-y-2">
        {program.map((p, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-sm text-gray-700 flex-1">{EXERCISE_LABELS[p.exercise]}</span>
            {BODYWEIGHT_EXERCISES.has(p.exercise) ? (
              <span className="text-xs text-gray-400 w-24 text-right">Bodyweight</span>
            ) : (
              <>
                <input
                  type="number"
                  min="1"
                  value={p.sets}
                  onChange={(e) => onFieldChange(i, 'sets', e.target.value)}
                  className="w-12 border border-gray-200 rounded-lg px-2 py-1 text-sm text-center"
                />
                <span className="text-xs text-gray-400">×</span>
                <input
                  type="number"
                  min="1"
                  value={p.reps}
                  onChange={(e) => onFieldChange(i, 'reps', e.target.value)}
                  className="w-12 border border-gray-200 rounded-lg px-2 py-1 text-sm text-center"
                />
              </>
            )}
            <button
              onClick={() => onRemove(i)}
              className="text-gray-300 hover:text-red-400 text-lg leading-none px-1"
            >
              ×
            </button>
          </div>
        ))}

        {adding && available.length > 0 ? (
          <select
            autoFocus
            className="w-full border border-brand-200 rounded-lg px-3 py-2 text-sm mt-1"
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) {
                onAdd(e.target.value as Exercise);
                setAdding(false);
              }
            }}
            onBlur={() => setAdding(false)}
          >
            <option value="" disabled>Select exercise…</option>
            {available.map((ex) => (
              <option key={ex} value={ex}>{EXERCISE_LABELS[ex]}</option>
            ))}
          </select>
        ) : available.length > 0 ? (
          <button
            onClick={() => setAdding(true)}
            className="text-xs text-brand-600 font-medium mt-1"
          >
            + Add exercise
          </button>
        ) : null}
      </div>
    </Section>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
        {title}
      </h3>
      {children}
    </div>
  );
}
