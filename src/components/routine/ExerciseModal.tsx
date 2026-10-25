import React, { useState, useEffect } from 'react';
import { ExerciseItem, TargetType } from '../../types';
import { X, Dumbbell, Clock, RotateCcw, Plus, Minus } from 'lucide-react';

interface ExerciseModalProps {
  isOpen: boolean;
  section: 'abs' | 'workout';
  onClose: () => void;
  onSave: (exercise: ExerciseItem) => void;
  initialExercise?: ExerciseItem | null;
}

export const ExerciseModal: React.FC<ExerciseModalProps> = ({
  isOpen,
  section,
  onClose,
  onSave,
  initialExercise,
}) => {
  const [name, setName] = useState('');
  const [sets, setSets] = useState(4);
  const [targetType, setTargetType] = useState<TargetType>('reps');
  const [targetValue, setTargetValue] = useState(8);
  const [restSeconds, setRestSeconds] = useState(90);
  const [notes, setNotes] = useState('');

  const calisthenicsPresets =
    section === 'abs'
      ? [
          'Hollow Body Hold',
          'Plank a terra',
          'L-Sit alle parallele',
          'Leg Raises alla sbarra',
          'Dragon Flag negativo',
          'Russian Twist',
          'Arch Body / Superman',
          'Side Plank',
        ]
      : [
          'Pull-up alla sbarra (Trazioni)',
          'Dip alle parallele',
          'Push-up a terra (Piegamenti)',
          'Muscle-up alla sbarra',
          'Australian Pull-up',
          'Pike Push-up (Spalle)',
          'Handstand Push-up assistito',
          'Chin-up (Trazioni supine)',
          'Pistol Squat a corpo libero',
          'Bulgarian Split Squat',
        ];

  useEffect(() => {
    if (initialExercise) {
      setName(initialExercise.name);
      setSets(initialExercise.sets);
      setTargetType(initialExercise.targetType);
      setTargetValue(initialExercise.targetValue);
      setRestSeconds(initialExercise.restSeconds);
      setNotes(initialExercise.notes || '');
    } else {
      setName('');
      setSets(section === 'abs' ? 3 : 4);
      setTargetType(section === 'abs' ? 'duration' : 'reps');
      setTargetValue(section === 'abs' ? 30 : 8);
      setRestSeconds(section === 'abs' ? 60 : 90);
      setNotes('');
    }
  }, [initialExercise, isOpen, section]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const item: ExerciseItem = {
      id: initialExercise ? initialExercise.id : `ex-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      type: 'exercise',
      name: name.trim(),
      sets: Math.max(1, sets),
      targetType,
      targetValue: Math.max(1, targetValue),
      restSeconds: Math.max(0, restSeconds),
      ...(notes.trim() ? { notes: notes.trim() } : {}),
    };

    onSave(item);
    onClose();
  };

  const restPresets = [30, 45, 60, 90, 120, 180];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="exercise-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-lg border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Dumbbell className="w-4 h-4" />
            </div>
            <div>
              <h2 id="exercise-modal-title" className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                {initialExercise ? 'Modifica Esercizio' : 'Nuovo Esercizio'}
              </h2>
              <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 uppercase">
                Sezione {section === 'abs' ? 'ABS & Core' : 'Workout Principale'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Chiudi"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
          {/* Exercise Name */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Nome dell'esercizio
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Es. Dip alle parallele"
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              autoFocus
            />

            {/* Presets */}
            <div className="mt-2">
              <span className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
                Esempi calisthenics:
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                {calisthenicsPresets.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setName(preset)}
                    className="px-2 py-0.5 text-[11px] rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Sets and Target Mode */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Sets Stepper */}
            <div className="bg-zinc-50 dark:bg-zinc-800/40 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                Numero di Serie
              </label>
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setSets((s) => Math.max(1, s - 1))}
                  className="w-9 h-9 rounded-lg bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 flex items-center justify-center text-zinc-700 dark:text-zinc-200 active:scale-95 cursor-pointer"
                  aria-label="Diminuisci serie"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="font-bold text-xl text-zinc-900 dark:text-zinc-100">
                  {sets}
                </span>
                <button
                  type="button"
                  onClick={() => setSets((s) => s + 1)}
                  className="w-9 h-9 rounded-lg bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 flex items-center justify-center text-zinc-700 dark:text-zinc-200 active:scale-95 cursor-pointer"
                  aria-label="Aumenta serie"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Target Type Selector */}
            <div className="bg-zinc-50 dark:bg-zinc-800/40 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                Tipo di Obiettivo
              </label>
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-zinc-200/60 dark:bg-zinc-700/60 rounded-lg text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setTargetType('reps')}
                  className={`py-1.5 rounded-md transition-all cursor-pointer ${
                    targetType === 'reps'
                      ? 'bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                      : 'text-zinc-600 dark:text-zinc-300'
                  }`}
                >
                  Ripetizioni
                </button>
                <button
                  type="button"
                  onClick={() => setTargetType('duration')}
                  className={`py-1.5 rounded-md transition-all cursor-pointer ${
                    targetType === 'duration'
                      ? 'bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                      : 'text-zinc-600 dark:text-zinc-300'
                  }`}
                >
                  Secondi
                </button>
              </div>
            </div>
          </div>

          {/* Target Value Input */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              {targetType === 'reps' ? 'Numero di Ripetizioni per serie' : 'Durata per serie (secondi)'}
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                min="1"
                max="999"
                required
                value={targetValue}
                onChange={(e) => setTargetValue(parseInt(e.target.value) || 0)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-900 dark:text-zinc-100 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 w-14 text-center">
                {targetType === 'reps' ? 'rip' : 'sec'}
              </span>
            </div>
          </div>

          {/* Rest Seconds */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-zinc-400" />
                <span>Tempo di Recupero tra le serie</span>
              </label>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                {restSeconds}s ({Math.floor(restSeconds / 60)}m {restSeconds % 60}s)
              </span>
            </div>
            <div className="flex items-center space-x-1.5">
              {restPresets.map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => setRestSeconds(sec)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    restSeconds === sec
                      ? 'bg-emerald-600 text-white'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  {sec}s
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Note esecuzione o zavorra (facoltativo)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Es. Gambe tese, zavorra +10kg, fermo 1 secondo in alto..."
              className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-zinc-200 dark:border-zinc-800 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-5 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white shadow-sm transition disabled:opacity-50 cursor-pointer"
            >
              {initialExercise ? 'Salva Esercizio' : 'Aggiungi Esercizio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
