import React, { useState, useEffect } from 'react';
import { WorkoutDay } from '../../types';
import { X, Calendar } from 'lucide-react';

interface DayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (dayData: { name: string }) => void;
  initialDay?: WorkoutDay | null;
}

export const DayModal: React.FC<DayModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialDay,
}) => {
  const [name, setName] = useState('');

  useEffect(() => {
    if (initialDay) {
      setName(initialDay.name);
    } else {
      setName('');
    }
  }, [initialDay, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ name: name.trim() });
    onClose();
  };

  const dayPresets = [
    'Lunedì - Spinta & Core',
    'Mercoledì - Trazione & Gambe',
    'Venerdì - Full Body & Skills',
    'Giorno A - Push',
    'Giorno B - Pull',
    'Giorno C - Legs & Abs',
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="day-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-md border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <h2 id="day-modal-title" className="font-bold text-base text-zinc-900 dark:text-zinc-100">
              {initialDay ? 'Modifica Giornata' : 'Nuova Giornata'}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Chiudi"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Nome della giornata
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Es. Lunedì - Trazioni e Dip"
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              autoFocus
            />
          </div>

          <div>
            <span className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-2">
              Suggerimenti rapidi:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {dayPresets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setName(preset)}
                  className="px-2.5 py-1 text-xs rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
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
              {initialDay ? 'Salva Modifiche' : 'Crea Giornata'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
