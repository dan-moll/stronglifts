import { useState, useRef } from 'react';
import type { Settings, Exercise } from '../types';
import { EXERCISE_LABELS, DEFAULT_SETTINGS } from '../types';
import { exportAll, importAll } from '../db';

const ALL_EXERCISES: Exercise[] = [
  'squat',
  'bench',
  'deadlift',
  'press',
  'powerClean',
  'barbellRow',
];

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
    updateSettings({
      workingWeights: { ...settings.workingWeights, [ex]: num },
    });
  };

  const setIncrement = (ex: Exercise, value: string) => {
    const num = parseFloat(value);
    if (isNaN(num) || num < 0) return;
    updateSettings({
      increments: { ...settings.increments, [ex]: num },
    });
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
      // Reload settings and history
      window.location.reload();
    } catch {
      setImportStatus('Import failed. Check file format.');
    }
  };

  const resetSettings = () => {
    updateSettings(DEFAULT_SETTINGS);
  };

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

      {/* Exercise substitution */}
      <Section title="Power Clean Substitution">
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={settings.useBarbelRow}
            onChange={(e) => updateSettings({ useBarbelRow: e.target.checked })}
            className="w-5 h-5 rounded text-brand-600"
          />
          <span className="text-sm text-gray-700">Use Barbell Row instead of Power Clean</span>
        </label>
      </Section>

      {/* Deload */}
      <Section title="Deload Percentage">
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={settings.deloadPercent}
            onChange={(e) =>
              updateSettings({ deloadPercent: Math.max(1, Math.min(50, parseInt(e.target.value) || 10)) })
            }
            className="w-20 border border-gray-200 rounded-lg px-3 py-2 text-sm"
          />
          <span className="text-sm text-gray-500">%</span>
        </div>
      </Section>

      {/* Working Weights */}
      <Section title="Working Weights">
        <div className="space-y-2">
          {ALL_EXERCISES.map((ex) => (
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

      {/* Increments */}
      <Section title="Increments">
        <div className="space-y-2">
          {ALL_EXERCISES.map((ex) => (
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
          <input
            ref={fileRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
          {importStatus && (
            <p className="text-xs text-center text-gray-500">{importStatus}</p>
          )}
        </div>
      </Section>

      {/* Reset */}
      <Section title="Danger Zone">
        <button
          onClick={resetSettings}
          className="w-full py-2.5 rounded-lg text-sm font-medium border border-red-200 text-red-500 active:bg-red-50"
        >
          Reset All Settings to Defaults
        </button>
      </Section>
    </div>
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
