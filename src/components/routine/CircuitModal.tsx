import React, { useState, useEffect } from 'react';
import { CircuitItem, CircuitExercise, TargetType } from '../../types';
import { X, Layers, Plus, Trash2, Clock, MoveUp, MoveDown } from 'lucide-react';

interface CircuitModalProps {
  isOpen: boolean;
  section: 'abs' | 'workout';
  onClose: () => void;
  onSave: (circuit: CircuitItem) => void;
  initialCircuit?: CircuitItem | null;
}

export const CircuitModal: React.FC<CircuitModalProps> = ({
  isOpen,
  section,
  onClose,
  onSave,
  initialCircuit,
}) => {
  const [name, setName] = useState('');
  const [rounds, setRounds] = useState(3);
  const [restBetweenExercises, setRestBetweenExercises] = useState(15);
  const [restBetweenRounds, setRestBetweenRounds] = useState(90);
  const [exercises, setExercises] = useState<CircuitExercise[]>([]);

  // Temp exercise input
  const [newExName, setNewExName] = useState('');
  const [newExTargetType, setNewExTargetType] = useState<TargetType>(
    section === 'abs' ? 'duration' : 'reps'
  );
  const [newExValue, setNewExValue] = useState(section === 'abs' ? 30 : 10);

  useEffect(() => {
    if (initialCircuit) {
      setName(initialCircuit.name);
      setRounds(initialCircuit.rounds);
      setRestBetweenExercises(initialCircuit.restBetweenExercises);
      setRestBetweenRounds(initialCircuit.restBetweenRounds);
      setExercises(initialCircuit.exercises || []);
    } else {
      setName(section === 'abs' ? 'Circuito Core Brucia Grassi' : 'Circuito Calisthenics');
      setRounds(3);
      setRestBetweenExercises(15);
      setRestBetweenRounds(90);
      setExercises([
        {
          id: `cex-1`,
          name: section === 'abs' ? 'Hollow Body Hold' : 'Push-up esplosivi',
          targetType: section === 'abs' ? 'duration' : 'reps',
          targetValue: section === 'abs' ? 30 : 12,
          restSeconds: 15,
        },
        {
          id: `cex-2`,
          name: section === 'abs' ? 'Plank a terra' : 'Australian Pull-up',
          targetType: section === 'abs' ? 'duration' : 'reps',
          targetValue: section === 'abs' ? 45 : 10,
          restSeconds: 15,
        },
      ]);
    }
  }, [initialCircuit, isOpen, section]);

  if (!isOpen) return null;

  const handleAddExercise = () => {
    if (!newExName.trim()) return;
    const item: CircuitExercise = {
      id: `cex-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: newExName.trim(),
      targetType: newExTargetType,
      targetValue: Math.max(1, newExValue),
      restSeconds: restBetweenExercises,
    };
    setExercises((prev) => [...prev, item]);
    setNewExName('');
  };

  const handleRemoveExercise = (index: number) => {
    setExercises((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMoveExercise = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= exercises.length) return;
    const updated = [...exercises];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIdx, 0, moved);
    setExercises(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || exercises.length === 0) return;

    const circuit: CircuitItem = {
      id: initialCircuit
        ? initialCircuit.id
        : `circ-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      type: 'circuit',
      name: name.trim(),
      rounds: Math.max(1, rounds),
      restBetweenExercises: Math.max(0, restBetweenExercises),
      restBetweenRounds: Math.max(0, restBetweenRounds),
      exercises,
    };

    onSave(circuit);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="circuit-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-lg border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 id="circuit-modal-title" className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                {initialCircuit ? 'Modifica Circuito' : 'Nuovo Circuito'}
              </h2>
              <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400 uppercase">
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

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
          {/* Circuit Name */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Nome del circuito
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Es. Circuito Addominali o Burnout Dip/Push-up"
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Rounds & Rest Settings */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="bg-zinc-50 dark:bg-zinc-800/40 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-center">
              <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                Giri (Rounds)
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={rounds}
                onChange={(e) => setRounds(parseInt(e.target.value) || 1)}
                className="w-full py-1 text-center font-bold text-lg text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-700 rounded-lg border border-zinc-200 dark:border-zinc-600"
              />
            </div>

            <div className="bg-zinc-50 dark:bg-zinc-800/40 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-center">
              <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                Rec. Esercizio
              </label>
              <div className="flex items-center justify-center space-x-1">
                <input
                  type="number"
                  min="0"
                  max="300"
                  step="5"
                  value={restBetweenExercises}
                  onChange={(e) => setRestBetweenExercises(parseInt(e.target.value) || 0)}
                  className="w-full py-1 text-center font-bold text-lg text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-700 rounded-lg border border-zinc-200 dark:border-zinc-600"
                />
                <span className="text-[10px] text-zinc-400">s</span>
              </div>
            </div>

            <div className="bg-zinc-50 dark:bg-zinc-800/40 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-center">
              <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                Rec. Fine Giro
              </label>
              <div className="flex items-center justify-center space-x-1">
                <input
                  type="number"
                  min="0"
                  max="600"
                  step="15"
                  value={restBetweenRounds}
                  onChange={(e) => setRestBetweenRounds(parseInt(e.target.value) || 0)}
                  className="w-full py-1 text-center font-bold text-lg text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-700 rounded-lg border border-zinc-200 dark:border-zinc-600"
                />
                <span className="text-[10px] text-zinc-400">s</span>
              </div>
            </div>
          </div>

          {/* Exercises in Circuit */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Esercizi nel circuito ({exercises.length})
              </label>
              {exercises.length === 0 && (
                <span className="text-xs text-red-500 font-medium">Aggiungi almeno 1 esercizio</span>
              )}
            </div>

            <div className="space-y-2 mb-3">
              {exercises.map((ex, index) => (
                <div
                  key={ex.id || index}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700"
                >
                  <div className="flex items-center space-x-2">
                    <span className="w-5 h-5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-xs flex items-center justify-center shrink-0">
                      {index + 1}
                    </span>
                    <div>
                      <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 block">
                        {ex.name}
                      </span>
                      <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        {ex.targetValue} {ex.targetType === 'reps' ? 'ripetizioni' : 'secondi'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => handleMoveExercise(index, 'up')}
                      aria-label="Sposta su"
                      className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 disabled:opacity-20 cursor-pointer"
                    >
                      <MoveUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={index === exercises.length - 1}
                      onClick={() => handleMoveExercise(index, 'down')}
                      aria-label="Sposta giù"
                      className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 disabled:opacity-20 cursor-pointer"
                    >
                      <MoveDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveExercise(index)}
                      aria-label="Rimuovi esercizio dal circuito"
                      className="p-1 text-zinc-400 hover:text-red-500 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick add exercise to circuit */}
            <div className="p-3 rounded-xl bg-zinc-100/70 dark:bg-zinc-800/30 border border-dashed border-zinc-300 dark:border-zinc-700 space-y-2">
              <span className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
                Aggiungi esercizio al circuito:
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newExName}
                  onChange={(e) => setNewExName(e.target.value)}
                  placeholder="Nome esercizio (es. Hollow Rock)"
                  className="flex-1 px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddExercise();
                    }
                  }}
                />
                <select
                  value={newExTargetType}
                  onChange={(e) => setNewExTargetType(e.target.value as TargetType)}
                  className="px-2 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100"
                >
                  <option value="reps">Ripetizioni</option>
                  <option value="duration">Secondi</option>
                </select>
                <input
                  type="number"
                  min="1"
                  value={newExValue}
                  onChange={(e) => setNewExValue(parseInt(e.target.value) || 1)}
                  className="w-14 px-2 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-center font-bold text-zinc-900 dark:text-zinc-100"
                />
                <button
                  type="button"
                  onClick={handleAddExercise}
                  disabled={!newExName.trim()}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold flex items-center space-x-1 disabled:opacity-40 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Aggiungi</span>
                </button>
              </div>
            </div>
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
              disabled={!name.trim() || exercises.length === 0}
              className="px-5 py-2 text-xs font-semibold rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white shadow-sm transition disabled:opacity-50 cursor-pointer"
            >
              {initialCircuit ? 'Salva Circuito' : 'Crea Circuito'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
