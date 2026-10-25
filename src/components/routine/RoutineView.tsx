import React, { useState } from 'react';
import {
  WorkoutDay,
  SectionItem,
  ExerciseItem,
  CircuitItem,
} from '../../types';
import { DayModal } from './DayModal';
import { ExerciseModal } from './ExerciseModal';
import { CircuitModal } from './CircuitModal';
import { ConfirmModal } from '../ui/ConfirmModal';
import { reorderItems } from '../../utils/workoutUtils';
import {
  Plus,
  PenLine,
  Edit2,
  Trash2,
  ChevronUp,
  ChevronDown,
  Layers,
  Dumbbell,
  Clock,
  Sparkles,
  Flame,
  Info,
} from 'lucide-react';

interface RoutineViewProps {
  days: WorkoutDay[];
  onSaveDay: (day: WorkoutDay) => Promise<void>;
  onDeleteDay: (dayId: string) => Promise<void>;
  onLogWorkout: (day: WorkoutDay) => void;
  onLoadExampleTemplate: () => Promise<void>;
  loading: boolean;
}

export const RoutineView: React.FC<RoutineViewProps> = ({
  days,
  onSaveDay,
  onDeleteDay,
  onLogWorkout,
  onLoadExampleTemplate,
  loading,
}) => {
  const [activeDayId, setActiveDayId] = useState<string | null>(null);

  // Modals state
  const [dayModalOpen, setDayModalOpen] = useState(false);
  const [editingDay, setEditingDay] = useState<WorkoutDay | null>(null);

  const [exerciseModalOpen, setExerciseModalOpen] = useState(false);
  const [exerciseSection, setExerciseSection] = useState<'abs' | 'workout'>('workout');
  const [editingExercise, setEditingExercise] = useState<ExerciseItem | null>(null);

  const [circuitModalOpen, setCircuitModalOpen] = useState(false);
  const [circuitSection, setCircuitSection] = useState<'abs' | 'workout'>('abs');
  const [editingCircuit, setEditingCircuit] = useState<CircuitItem | null>(null);

  // Custom Delete Confirm state
  const [deleteConfirmation, setDeleteConfirmation] = useState<
    | { type: 'day'; day: WorkoutDay }
    | { type: 'item'; section: 'abs' | 'workout'; itemId: string; itemName: string }
    | null
  >(null);

  // Fallback to first day if none selected
  const currentDay = days.find((d) => d.id === activeDayId) || days[0] || null;

  // Day Handlers
  const handleCreateOrUpdateDay = async (data: { name: string }) => {
    if (editingDay) {
      const updated: WorkoutDay = {
        ...editingDay,
        name: data.name,
        updatedAt: new Date().toISOString(),
      };
      await onSaveDay(updated);
    } else {
      const newDay: WorkoutDay = {
        id: `day-${Date.now()}`,
        userId: '',
        name: data.name,
        order: days.length + 1,
        absItems: [],
        workoutItems: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await onSaveDay(newDay);
      setActiveDayId(newDay.id);
    }
  };

  const handleDeleteCurrentDay = (day: WorkoutDay) => {
    setDeleteConfirmation({ type: 'day', day });
  };

  const handleMoveDay = async (day: WorkoutDay, direction: 'up' | 'down') => {
    const currentIndex = days.findIndex((d) => d.id === day.id);
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= days.length) return;

    const reordered = reorderItems(days, currentIndex, targetIndex);
    // Update orders
    for (let i = 0; i < reordered.length; i++) {
      reordered[i].order = i + 1;
      await onSaveDay(reordered[i]);
    }
  };

  // Section item handlers
  const handleSaveExercise = async (exercise: ExerciseItem) => {
    if (!currentDay) return;
    setActiveDayId(currentDay.id);
    const isAbs = exerciseSection === 'abs';
    const items = isAbs ? [...currentDay.absItems] : [...currentDay.workoutItems];

    const existingIndex = items.findIndex((i) => i.id === exercise.id);
    if (existingIndex >= 0) {
      items[existingIndex] = exercise;
    } else {
      items.push(exercise);
    }

    const updated: WorkoutDay = {
      ...currentDay,
      absItems: isAbs ? items : currentDay.absItems,
      workoutItems: !isAbs ? items : currentDay.workoutItems,
      updatedAt: new Date().toISOString(),
    };
    await onSaveDay(updated);
  };

  const handleSaveCircuit = async (circuit: CircuitItem) => {
    if (!currentDay) return;
    setActiveDayId(currentDay.id);
    const isAbs = circuitSection === 'abs';
    const items = isAbs ? [...currentDay.absItems] : [...currentDay.workoutItems];

    const existingIndex = items.findIndex((i) => i.id === circuit.id);
    if (existingIndex >= 0) {
      items[existingIndex] = circuit;
    } else {
      items.push(circuit);
    }

    const updated: WorkoutDay = {
      ...currentDay,
      absItems: isAbs ? items : currentDay.absItems,
      workoutItems: !isAbs ? items : currentDay.workoutItems,
      updatedAt: new Date().toISOString(),
    };
    await onSaveDay(updated);
  };

  const handleDeleteItem = async (section: 'abs' | 'workout', itemId: string) => {
    if (!currentDay) return;
    const isAbs = section === 'abs';
    const items = isAbs
      ? currentDay.absItems.filter((i) => i.id !== itemId)
      : currentDay.workoutItems.filter((i) => i.id !== itemId);

    const updated: WorkoutDay = {
      ...currentDay,
      absItems: isAbs ? items : currentDay.absItems,
      workoutItems: !isAbs ? items : currentDay.workoutItems,
      updatedAt: new Date().toISOString(),
    };
    await onSaveDay(updated);
  };

  const handleMoveItem = async (
    section: 'abs' | 'workout',
    index: number,
    direction: 'up' | 'down'
  ) => {
    if (!currentDay) return;
    const isAbs = section === 'abs';
    const items = isAbs ? [...currentDay.absItems] : [...currentDay.workoutItems];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    const reordered = reorderItems(items, index, targetIndex);
    const updated: WorkoutDay = {
      ...currentDay,
      absItems: isAbs ? reordered : currentDay.absItems,
      workoutItems: !isAbs ? reordered : currentDay.workoutItems,
      updatedAt: new Date().toISOString(),
    };
    await onSaveDay(updated);
  };

  return (
    <div className="space-y-5 pb-24">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Scheda di Allenamento
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Organizza le tue giornate divise in ABS e Workout principale
          </p>
        </div>
        <button
          onClick={() => {
            setEditingDay(null);
            setDayModalOpen(true);
          }}
          className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-semibold text-xs shadow-sm transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nuova Giornata</span>
        </button>
      </div>

      {/* Empty State */}
      {days.length === 0 && !loading && (
        <div className="p-8 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-dashed border-zinc-300 dark:border-zinc-800 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
            <Dumbbell className="w-6 h-6" />
          </div>
          <div className="max-w-sm mx-auto space-y-1">
            <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
              Nessuna scheda creata
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Inizia creando la tua prima giornata di allenamento calisthenics oppure carica la scheda d'esempio consigliata.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
            <button
              onClick={() => {
                setEditingDay(null);
                setDayModalOpen(true);
              }}
              className="w-full sm:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
            >
              Crea Giornata da zero
            </button>
            <button
              onClick={onLoadExampleTemplate}
              className="w-full sm:w-auto px-4 py-2.5 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Carica Scheda Calisthenics d'esempio</span>
            </button>
          </div>
        </div>
      )}

      {/* Days Tabs (Horizontal scroll on mobile) */}
      {days.length > 0 && (
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
          {days.map((day, idx) => {
            const isSelected = (currentDay && currentDay.id === day.id) || false;
            return (
              <button
                key={day.id}
                onClick={() => setActiveDayId(day.id)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-transparent shadow-sm'
                    : 'bg-white dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300'
                }`}
              >
                <span>{day.name}</span>
                <span className="text-[10px] opacity-60">
                  ({day.absItems.length + day.workoutItems.length})
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Selected Day View */}
      {currentDay && (
        <div className="space-y-4">
          {/* Day Toolbar */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                  {currentDay.name}
                </h3>
                <button
                  onClick={() => {
                    setEditingDay(currentDay);
                    setDayModalOpen(true);
                  }}
                  aria-label="Rinomina giornata"
                  className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                {currentDay.absItems.length} elementi ABS • {currentDay.workoutItems.length} elementi Workout
              </p>
            </div>

            <div className="flex items-center space-x-2">
              {/* Move Day Buttons */}
              <button
                onClick={() => handleMoveDay(currentDay, 'up')}
                aria-label="Sposta giornata a sinistra"
                title="Sposta prima"
                className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer"
              >
                <ChevronUp className="w-4 h-4 -rotate-90 sm:rotate-0" />
              </button>
              <button
                onClick={() => handleMoveDay(currentDay, 'down')}
                aria-label="Sposta giornata a destra"
                title="Sposta dopo"
                className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer"
              >
                <ChevronDown className="w-4 h-4 -rotate-90 sm:rotate-0" />
              </button>

              <button
                onClick={() => handleDeleteCurrentDay(currentDay)}
                aria-label="Elimina giornata"
                title="Elimina giornata"
                className="p-2 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              {/* Log Workout Button */}
              <button
                onClick={() => onLogWorkout(currentDay)}
                className="flex items-center space-x-1.5 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-500/20 cursor-pointer transition ml-1"
              >
                <PenLine className="w-3.5 h-3.5" />
                <span>Inserisci Risultati</span>
              </button>
            </div>
          </div>

          {/* SECTION 1: ABS */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2.5">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                    Sezione ABS & Core
                  </h4>
                  <span className="text-[10px] text-zinc-500">
                    Riscaldamento specifico e potenziamento addome
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-1.5">
                <button
                  onClick={() => {
                    setExerciseSection('abs');
                    setEditingExercise(null);
                    setExerciseModalOpen(true);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-[11px] font-semibold flex items-center space-x-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3 text-amber-500" />
                  <span>Esercizio</span>
                </button>
                <button
                  onClick={() => {
                    setCircuitSection('abs');
                    setEditingCircuit(null);
                    setCircuitModalOpen(true);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[11px] font-semibold flex items-center space-x-1 cursor-pointer"
                >
                  <Layers className="w-3 h-3" />
                  <span>Circuito</span>
                </button>
              </div>
            </div>

            {/* ABS items list */}
            {currentDay.absItems.length === 0 ? (
              <p className="text-xs text-zinc-400 py-3 text-center italic">
                Nessun esercizio ABS aggiunto a questa giornata.
              </p>
            ) : (
              <div className="space-y-2">
                {currentDay.absItems.map((item, idx) => (
                  <SectionItemCard
                    key={item.id}
                    item={item}
                    index={idx}
                    totalItems={currentDay.absItems.length}
                    section="abs"
                    onMove={(dir) => handleMoveItem('abs', idx, dir)}
                    onEdit={() => {
                      if (item.type === 'exercise') {
                        setExerciseSection('abs');
                        setEditingExercise(item);
                        setExerciseModalOpen(true);
                      } else {
                        setCircuitSection('abs');
                        setEditingCircuit(item);
                        setCircuitModalOpen(true);
                      }
                    }}
                    onDelete={() =>
                      setDeleteConfirmation({
                        type: 'item',
                        section: 'abs',
                        itemId: item.id,
                        itemName: item.name,
                      })
                    }
                  />
                ))}
              </div>
            )}
          </div>

          {/* SECTION 2: WORKOUT */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2.5">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Dumbbell className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                    Sezione Workout Principale
                  </h4>
                  <span className="text-[10px] text-zinc-500">
                    Trazioni, dip, push-up, zavorre e skills
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-1.5">
                <button
                  onClick={() => {
                    setExerciseSection('workout');
                    setEditingExercise(null);
                    setExerciseModalOpen(true);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-[11px] font-semibold flex items-center space-x-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3 text-emerald-500" />
                  <span>Esercizio</span>
                </button>
                <button
                  onClick={() => {
                    setCircuitSection('workout');
                    setEditingCircuit(null);
                    setCircuitModalOpen(true);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold flex items-center space-x-1 cursor-pointer"
                >
                  <Layers className="w-3 h-3" />
                  <span>Circuito</span>
                </button>
              </div>
            </div>

            {/* Workout items list */}
            {currentDay.workoutItems.length === 0 ? (
              <p className="text-xs text-zinc-400 py-3 text-center italic">
                Nessun esercizio Workout aggiunto a questa giornata.
              </p>
            ) : (
              <div className="space-y-2">
                {currentDay.workoutItems.map((item, idx) => (
                  <SectionItemCard
                    key={item.id}
                    item={item}
                    index={idx}
                    totalItems={currentDay.workoutItems.length}
                    section="workout"
                    onMove={(dir) => handleMoveItem('workout', idx, dir)}
                    onEdit={() => {
                      if (item.type === 'exercise') {
                        setExerciseSection('workout');
                        setEditingExercise(item);
                        setExerciseModalOpen(true);
                      } else {
                        setCircuitSection('workout');
                        setEditingCircuit(item);
                        setCircuitModalOpen(true);
                      }
                    }}
                    onDelete={() =>
                      setDeleteConfirmation({
                        type: 'item',
                        section: 'workout',
                        itemId: item.id,
                        itemName: item.name,
                      })
                    }
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      <DayModal
        isOpen={dayModalOpen}
        initialDay={editingDay}
        onClose={() => setDayModalOpen(false)}
        onSave={handleCreateOrUpdateDay}
      />

      <ExerciseModal
        isOpen={exerciseModalOpen}
        section={exerciseSection}
        initialExercise={editingExercise}
        onClose={() => setExerciseModalOpen(false)}
        onSave={handleSaveExercise}
      />

      <CircuitModal
        isOpen={circuitModalOpen}
        section={circuitSection}
        initialCircuit={editingCircuit}
        onClose={() => setCircuitModalOpen(false)}
        onSave={handleSaveCircuit}
      />

      {/* Custom Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteConfirmation)}
        title={
          deleteConfirmation?.type === 'day'
            ? 'Elimina Giornata'
            : 'Elimina Esercizio o Circuito'
        }
        message={
          deleteConfirmation?.type === 'day'
            ? `Sei sicuro di voler eliminare la giornata "${deleteConfirmation.day.name}"? Tutti gli esercizi associati verranno rimossi.`
            : `Sei sicuro di voler rimuovere "${deleteConfirmation?.itemName}" da questa giornata?`
        }
        confirmLabel={deleteConfirmation?.type === 'day' ? 'Elimina Giornata' : 'Rimuovi'}
        onConfirm={async () => {
          if (!deleteConfirmation) return;
          if (deleteConfirmation.type === 'day') {
            const dayId = deleteConfirmation.day.id;
            setDeleteConfirmation(null);
            await onDeleteDay(dayId);
            if (activeDayId === dayId) {
              const remaining = days.filter((d) => d.id !== dayId);
              setActiveDayId(remaining.length > 0 ? remaining[0].id : null);
            }
          } else {
            const { section, itemId } = deleteConfirmation;
            setDeleteConfirmation(null);
            await handleDeleteItem(section, itemId);
          }
        }}
        onCancel={() => setDeleteConfirmation(null)}
      />
    </div>
  );
};

interface SectionItemCardProps {
  item: SectionItem;
  index: number;
  totalItems: number;
  section: 'abs' | 'workout';
  onMove: (direction: 'up' | 'down') => void;
  onEdit: () => void;
  onDelete: () => void;
}

const SectionItemCard: React.FC<SectionItemCardProps> = ({
  item,
  index,
  totalItems,
  onMove,
  onEdit,
  onDelete,
}) => {
  if (item.type === 'circuit') {
    return (
      <div className="p-3 rounded-xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold text-[10px] tracking-wide uppercase flex items-center space-x-1">
              <Layers className="w-3 h-3" />
              <span>Circuito</span>
            </span>
            <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100">
              {item.name}
            </span>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => onMove('up')}
              disabled={index === 0}
              aria-label="Sposta su"
              className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 disabled:opacity-20 cursor-pointer"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onMove('down')}
              disabled={index === totalItems - 1}
              aria-label="Sposta giù"
              className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 disabled:opacity-20 cursor-pointer"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onEdit}
              aria-label="Modifica circuito"
              className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onDelete}
              aria-label="Elimina circuito"
              className="p-1 text-zinc-400 hover:text-red-500 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Circuit details */}
        <div className="flex items-center space-x-3 text-[11px] text-zinc-600 dark:text-zinc-400 pl-1">
          <span className="font-semibold text-amber-600 dark:text-amber-400">
            {item.rounds} giri
          </span>
          <span>• Rec. es: {item.restBetweenExercises}s</span>
          <span>• Rec. giro: {item.restBetweenRounds}s</span>
        </div>

        {/* Exercises inside circuit */}
        <div className="space-y-1 pt-1 border-t border-amber-500/15">
          {item.exercises.map((ex, exIdx) => (
            <div
              key={ex.id || exIdx}
              className="flex items-center justify-between text-xs py-0.5 px-1.5 rounded-md bg-white/70 dark:bg-zinc-800/70 text-zinc-800 dark:text-zinc-200"
            >
              <span className="font-medium">
                {exIdx + 1}. {ex.name}
              </span>
              <span className="text-[11px] font-semibold text-zinc-500">
                {ex.targetValue} {ex.targetType === 'reps' ? 'rip' : 's'}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Single Exercise Card
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition">
      <div className="flex items-center space-x-3">
        <div className="w-7 h-7 rounded-lg bg-zinc-200/60 dark:bg-zinc-700/60 text-zinc-700 dark:text-zinc-300 flex items-center justify-center font-bold text-xs shrink-0">
          {item.sets}x
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">
              {item.name}
            </span>
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              {item.targetValue} {item.targetType === 'reps' ? 'rip' : 'sec'}
            </span>
          </div>

          <div className="flex items-center space-x-2 text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
            <span className="flex items-center space-x-0.5">
              <Clock className="w-3 h-3" />
              <span>Rec. {item.restSeconds}s</span>
            </span>
            {item.notes && <span>• {item.notes}</span>}
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-1 shrink-0">
        <button
          onClick={() => onMove('up')}
          disabled={index === 0}
          aria-label="Sposta su"
          className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 disabled:opacity-20 cursor-pointer"
        >
          <ChevronUp className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onMove('down')}
          disabled={index === totalItems - 1}
          aria-label="Sposta giù"
          className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 disabled:opacity-20 cursor-pointer"
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onEdit}
          aria-label="Modifica esercizio"
          className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onDelete}
          aria-label="Elimina esercizio"
          className="p-1 text-zinc-400 hover:text-red-500 cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
