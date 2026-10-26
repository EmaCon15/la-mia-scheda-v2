import React, { useState, useEffect } from 'react';
import {
  WorkoutDay,
  WorkoutSession,
  LoggedExercise,
  LoggedSet,
} from '../../types';
import {
  generatePTSummary,
  evaluateSetTarget,
  evaluateExerciseTarget,
  evaluateSessionTargets,
} from '../../utils/workoutUtils';
import { ConfirmModal } from '../ui/ConfirmModal';
import {
  ClipboardCheck,
  History,
  Calendar,
  Check,
  Copy,
  Share2,
  Trash2,
  ChevronDown,
  ChevronUp,
  Plus,
  Minus,
  Sparkles,
  Flame,
  Dumbbell,
  CheckCircle2,
  PenLine,
  Target,
  AlertTriangle,
  Trophy,
} from 'lucide-react';

interface LogWorkoutViewProps {
  days: WorkoutDay[];
  sessions: WorkoutSession[];
  onSaveSession: (session: WorkoutSession) => Promise<void>;
  onDeleteSession: (sessionId: string) => Promise<void>;
  preselectedDayId?: string | null;
  onClearPreselectedDay?: () => void;
  loading: boolean;
}

export const LogWorkoutView: React.FC<LogWorkoutViewProps> = ({
  days,
  sessions,
  onSaveSession,
  onDeleteSession,
  preselectedDayId,
  onClearPreselectedDay,
  loading,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'storico' | 'nuovo'>(
    preselectedDayId ? 'nuovo' : 'storico'
  );
  const [sessionToDelete, setSessionToDelete] = useState<WorkoutSession | null>(null);

  // Form State
  const [selectedDayId, setSelectedDayId] = useState<string>(() => {
    if (preselectedDayId) return preselectedDayId;
    return days.length > 0 ? days[0].id : '';
  });

  const [sessionDate, setSessionDate] = useState(() =>
    new Date().toISOString().split('T')[0]
  );
  const [durationMinutes, setDurationMinutes] = useState<string>('');
  const [sessionNotes, setSessionNotes] = useState('');
  const [loggedItems, setLoggedItems] = useState<LoggedExercise[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Completed / Shared summary modal
  const [savedSession, setSavedSession] = useState<WorkoutSession | null>(null);
  const [copiedToast, setCopiedToast] = useState(false);

  // History expansion state
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const [historyCopiedId, setHistoryCopiedId] = useState<string | null>(null);

  // Update selected day when preselectedDayId changes
  useEffect(() => {
    if (preselectedDayId) {
      setSelectedDayId(preselectedDayId);
      setActiveSubTab('nuovo');
    }
  }, [preselectedDayId]);

  // Sync exercises when selected day changes
  const currentDay = days.find((d) => d.id === selectedDayId) || null;

  useEffect(() => {
    if (!currentDay) {
      setLoggedItems([]);
      return;
    }

    const items: LoggedExercise[] = [];

    // ABS items
    currentDay.absItems.forEach((item) => {
      if (item.type === 'circuit') {
        item.exercises.forEach((ex) => {
          const sets: LoggedSet[] = [];
          for (let r = 1; r <= item.rounds; r++) {
            sets.push({
              setNumber: r,
              roundNumber: r,
              target: `${ex.targetValue} ${ex.targetType === 'reps' ? 'rip' : 's'}`,
              completedRepsOrSec: ex.targetValue,
              weightKg: 0,
              completed: true,
            });
          }
          items.push({
            itemId: `${item.id}-${ex.id}`,
            name: ex.name,
            section: 'abs',
            circuitName: item.name,
            isCircuit: true,
            sets,
          });
        });
      } else {
        const sets: LoggedSet[] = [];
        for (let s = 1; s <= item.sets; s++) {
          sets.push({
            setNumber: s,
            target: `${item.targetValue} ${item.targetType === 'reps' ? 'rip' : 's'}`,
            completedRepsOrSec: item.targetValue,
            weightKg: 0,
            completed: true,
          });
        }
        items.push({
          itemId: item.id,
          name: item.name,
          section: 'abs',
          sets,
          notes: item.notes,
        });
      }
    });

    // Workout items
    currentDay.workoutItems.forEach((item) => {
      if (item.type === 'circuit') {
        item.exercises.forEach((ex) => {
          const sets: LoggedSet[] = [];
          for (let r = 1; r <= item.rounds; r++) {
            sets.push({
              setNumber: r,
              roundNumber: r,
              target: `${ex.targetValue} ${ex.targetType === 'reps' ? 'rip' : 's'}`,
              completedRepsOrSec: ex.targetValue,
              weightKg: 0,
              completed: true,
            });
          }
          items.push({
            itemId: `${item.id}-${ex.id}`,
            name: ex.name,
            section: 'workout',
            circuitName: item.name,
            isCircuit: true,
            sets,
          });
        });
      } else {
        const sets: LoggedSet[] = [];
        for (let s = 1; s <= item.sets; s++) {
          sets.push({
            setNumber: s,
            target: `${item.targetValue} ${item.targetType === 'reps' ? 'rip' : 's'}`,
            completedRepsOrSec: item.targetValue,
            weightKg: 0,
            completed: true,
          });
        }
        items.push({
          itemId: item.id,
          name: item.name,
          section: 'workout',
          sets,
          notes: item.notes,
        });
      }
    });

    setLoggedItems(items);
  }, [currentDay]);

  // Set modifications
  const handleUpdateSetValue = (
    itemIndex: number,
    setIndex: number,
    value: number
  ) => {
    const updated = [...loggedItems];
    updated[itemIndex].sets[setIndex].completedRepsOrSec = Math.max(0, value);
    setLoggedItems(updated);
  };

  const handleUpdateWeight = (
    itemIndex: number,
    setIndex: number,
    weight: number
  ) => {
    const updated = [...loggedItems];
    updated[itemIndex].sets[setIndex].weightKg = Math.max(0, weight);
    setLoggedItems(updated);
  };

  const handleAddSet = (itemIndex: number) => {
    const updated = [...loggedItems];
    const item = updated[itemIndex];
    const lastSet = item.sets[item.sets.length - 1];
    const newSetNumber = item.sets.length + 1;

    item.sets.push({
      setNumber: newSetNumber,
      target: lastSet ? lastSet.target : '8 rip',
      completedRepsOrSec: lastSet ? lastSet.completedRepsOrSec : 8,
      weightKg: lastSet ? lastSet.weightKg : 0,
      completed: true,
    });
    setLoggedItems(updated);
  };

  const handleRemoveSet = (itemIndex: number) => {
    const updated = [...loggedItems];
    const item = updated[itemIndex];
    if (item.sets.length > 1) {
      item.sets.pop();
      setLoggedItems(updated);
    }
  };

  const handleUpdateNotes = (itemIndex: number, notes: string) => {
    const updated = [...loggedItems];
    updated[itemIndex].notes = notes;
    setLoggedItems(updated);
  };

  // Submit and Save
  const handleSaveWorkoutResults = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentDay) {
      alert('Seleziona una giornata della scheda.');
      return;
    }

    try {
      setIsSaving(true);
      const session: WorkoutSession = {
        id: `session-${Date.now()}`,
        userId: '',
        dayId: currentDay.id,
        dayName: currentDay.name,
        date: sessionDate,
        durationMinutes: durationMinutes ? parseInt(durationMinutes) : undefined,
        completedItems: loggedItems,
        notes: sessionNotes.trim() ? sessionNotes.trim() : undefined,
        createdAt: new Date().toISOString(),
      };

      session.ptSummary = generatePTSummary(session);

      await onSaveSession(session);
      setSavedSession(session);
      if (onClearPreselectedDay) onClearPreselectedDay();
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyPTSummary = (textToCopy: string, isHistory = false) => {
    navigator.clipboard.writeText(textToCopy);
    if (isHistory) {
      setHistoryCopiedId(textToCopy);
      setTimeout(() => setHistoryCopiedId(null), 2500);
    } else {
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2500);
    }
  };

  const handleWhatsAppShare = (textToShare: string) => {
    const encoded = encodeURIComponent(textToShare);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  return (
    <div className="space-y-5 pb-24">
      {/* Top Header */}
      <div>
        <h2 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">
          Registro Allenamenti
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Inserisci i risultati completati e consulta lo storico delle tue sessioni
        </p>
      </div>

      {/* Sub tabs: Storico Sessioni vs Inserisci Risultati */}
      <div className="grid grid-cols-2 p-1 bg-zinc-200/70 dark:bg-zinc-800 rounded-xl text-xs font-bold">
        <button
          onClick={() => setActiveSubTab('storico')}
          className={`py-2 rounded-lg flex items-center justify-center space-x-1.5 transition cursor-pointer ${
            activeSubTab === 'storico'
              ? 'bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Storico ({sessions.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('nuovo')}
          className={`py-2 rounded-lg flex items-center justify-center space-x-1.5 transition cursor-pointer ${
            activeSubTab === 'nuovo'
              ? 'bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
          }`}
        >
          <PenLine className="w-3.5 h-3.5" />
          <span>Inserisci Risultati</span>
        </button>
      </div>

      {/* VIEW 1: INSERISCI RISULTATI */}
      {activeSubTab === 'nuovo' && (
        <form onSubmit={handleSaveWorkoutResults} className="space-y-4">
          {/* Day selection and Date card */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-3">
            <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center space-x-2">
              <ClipboardCheck className="w-4 h-4 text-emerald-500" />
              <span>Dettagli Sessione</span>
            </h3>

            {days.length === 0 ? (
              <p className="text-xs text-amber-600 dark:text-amber-400 py-1">
                Nessuna giornata nella scheda. Crea prima una giornata nella sezione Scheda.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Choose Day */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Giornata della Scheda
                  </label>
                  <select
                    value={selectedDayId}
                    onChange={(e) => setSelectedDayId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-900 dark:text-zinc-100 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {days.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.absItems.length} ABS, {d.workoutItems.length} Workout)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Data Allenamento
                  </label>
                  <input
                    type="date"
                    required
                    value={sessionDate}
                    onChange={(e) => setSessionDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Exercises list to fill out */}
          {loggedItems.length > 0 && (
            <div className="space-y-4">
              {/* ABS Items */}
              {loggedItems.some((i) => i.section === 'abs') && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 pt-1">
                    <div className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                      <Flame className="w-3.5 h-3.5" />
                    </div>
                    <h4 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100 tracking-tight">
                      SEZIONE ABS
                    </h4>
                  </div>

                  {loggedItems
                    .map((item, index) => ({ item, index }))
                    .filter(({ item }) => item.section === 'abs')
                    .map(({ item, index }) => (
                      <ExerciseResultsCard
                        key={item.itemId || index}
                        item={item}
                        onUpdateSetValue={(setIdx, val) =>
                          handleUpdateSetValue(index, setIdx, val)
                        }
                        onUpdateWeight={(setIdx, wt) =>
                          handleUpdateWeight(index, setIdx, wt)
                        }
                        onAddSet={() => handleAddSet(index)}
                        onRemoveSet={() => handleRemoveSet(index)}
                        onUpdateNotes={(txt) => handleUpdateNotes(index, txt)}
                      />
                    ))}
                </div>
              )}

              {/* Workout Items */}
              {loggedItems.some((i) => i.section === 'workout') && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 pt-2">
                    <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                      <Dumbbell className="w-3.5 h-3.5" />
                    </div>
                    <h4 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100 tracking-tight">
                      SEZIONE WORKOUT
                    </h4>
                  </div>

                  {loggedItems
                    .map((item, index) => ({ item, index }))
                    .filter(({ item }) => item.section === 'workout')
                    .map(({ item, index }) => (
                      <ExerciseResultsCard
                        key={item.itemId || index}
                        item={item}
                        onUpdateSetValue={(setIdx, val) =>
                          handleUpdateSetValue(index, setIdx, val)
                        }
                        onUpdateWeight={(setIdx, wt) =>
                          handleUpdateWeight(index, setIdx, wt)
                        }
                        onAddSet={() => handleAddSet(index)}
                        onRemoveSet={() => handleRemoveSet(index)}
                        onUpdateNotes={(txt) => handleUpdateNotes(index, txt)}
                      />
                    ))}
                </div>
              )}

              {/* Session Notes and Estimated Duration */}
              <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Note complessive sull'allenamento (facoltative)
                    </label>
                    <textarea
                      rows={2}
                      value={sessionNotes}
                      onChange={(e) => setSessionNotes(e.target.value)}
                      placeholder="Es. Buone sensazioni generali, recuperi regolari, aumentata zavorra sulle dip."
                      className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Durata stimata (minuti)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="300"
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(e.target.value)}
                      placeholder="Es. 60"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <span className="text-[10px] text-zinc-400 mt-1 block">
                      Facoltativo (nessun cronometro obbligatorio)
                    </span>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSaving || loggedItems.length === 0}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-98 text-white font-extrabold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/20 transition cursor-pointer"
                >
                  <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                  <span>
                    {isSaving
                      ? 'Salvataggio in corso...'
                      : 'Salva Risultati nello Storico'}
                  </span>
                </button>
              </div>
            </div>
          )}
        </form>
      )}

      {/* VIEW 2: STORICO DELLE SESSIONI */}
      {activeSubTab === 'storico' && (
        <div className="space-y-3">
          {sessions.length === 0 && !loading && (
            <div className="p-8 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-dashed border-zinc-300 dark:border-zinc-800 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                <History className="w-6 h-6" />
              </div>
              <div className="max-w-sm mx-auto space-y-1">
                <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                  Nessun allenamento registrato
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Inserisci i risultati del tuo ultimo allenamento dalla scheda per visualizzare lo storico e condividere il report col tuo trainer.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveSubTab('nuovo')}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold inline-flex items-center space-x-1.5 shadow-xs cursor-pointer transition"
                  >
                    <PenLine className="w-3.5 h-3.5" />
                    <span>Inserisci Risultati</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {sessions.map((session) => {
            const isExpanded = expandedSessionId === session.id;
            const completedSetsCount = session.completedItems.reduce(
              (acc, item) => acc + item.sets.filter((s) => s.completed).length,
              0
            );
            const sessionTargets = evaluateSessionTargets(session);

            return (
              <div
                key={session.id}
                className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs overflow-hidden transition"
              >
                {/* Header card */}
                <div
                  onClick={() =>
                    setExpandedSessionId(isExpanded ? null : session.id)
                  }
                  className="p-4 cursor-pointer hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40 transition flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                        {session.dayName}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold">
                        {completedSetsCount} serie
                      </span>
                      {sessionTargets.totalExercises > 0 && (
                        sessionTargets.allTargetsReached ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 font-bold flex items-center space-x-1">
                            <Trophy className="w-3 h-3 text-emerald-500" />
                            <span>Target 100% ({sessionTargets.fullyReachedExercises}/{sessionTargets.totalExercises})</span>
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25 font-bold flex items-center space-x-1">
                            <Target className="w-3 h-3 text-amber-500" />
                            <span>{sessionTargets.fullyReachedExercises}/{sessionTargets.totalExercises} a target</span>
                          </span>
                        )
                      )}
                    </div>

                    <div className="flex items-center space-x-3 text-xs text-zinc-500 dark:text-zinc-400">
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{session.date}</span>
                      </span>
                      {session.durationMinutes && (
                        <span>• {session.durationMinutes} min</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (session.ptSummary) {
                          handleCopyPTSummary(session.ptSummary, true);
                        }
                      }}
                      title="Copia riepilogo per il Trainer"
                      className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 text-zinc-600 dark:text-zinc-300 transition cursor-pointer"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedSessionId(isExpanded ? null : session.id);
                      }}
                      aria-label="Espandi o comprimi dettagli"
                      className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded Session Details */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 border-t border-zinc-100 dark:border-zinc-800 space-y-3 animate-in fade-in duration-150">
                    {/* Copy toast */}
                    {historyCopiedId === session.ptSummary && (
                      <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold text-center">
                        ✓ Report copiato negli appunti! Incollalo su WhatsApp per il tuo trainer.
                      </div>
                    )}

                    {/* Performed items with target indicators */}
                    <div className="space-y-2.5">
                      {session.completedItems.map((item, iIdx) => {
                        const targetEval = evaluateExerciseTarget(item);

                        return (
                          <div
                            key={iIdx}
                            className={`p-3 rounded-xl border text-xs space-y-2 transition-all ${
                              targetEval.isFullyReached
                                ? 'bg-emerald-500/[0.04] dark:bg-emerald-500/[0.07] border-emerald-500/30 dark:border-emerald-500/20'
                                : 'bg-amber-500/[0.04] dark:bg-amber-500/[0.07] border-amber-500/30 dark:border-amber-500/20'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div>
                                <span className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100 block">
                                  {item.circuitName ? `[${item.circuitName}] ` : ''}
                                  {item.name}
                                </span>
                                <span className="text-[10px] text-zinc-400 uppercase font-semibold">
                                  Sezione {item.section}
                                </span>
                              </div>

                              {targetEval.isFullyReached ? (
                                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 font-bold text-[11px] flex items-center space-x-1 shrink-0 shadow-xs">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                  <span>Target Raggiunto</span>
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-bold text-[11px] flex items-center space-x-1 shrink-0 shadow-xs">
                                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                                  <span>Sotto Target ({targetEval.reachedSetsCount}/{targetEval.totalSetsCount})</span>
                                </span>
                              )}
                            </div>

                            {/* Set pills with clear target vs done indicator */}
                            <div className="flex flex-wrap gap-2 text-[11px]">
                              {item.sets.map((s, sIdx) => {
                                const setEval = evaluateSetTarget(s);
                                return (
                                  <span
                                    key={sIdx}
                                    className={`px-2.5 py-1 rounded-lg border font-medium flex items-center space-x-1.5 transition shadow-xs ${
                                      setEval.isReached
                                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800'
                                        : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 border-rose-300 dark:border-rose-800'
                                    }`}
                                  >
                                    <span className="font-bold opacity-80">
                                      {s.roundNumber ? `Giro ${s.roundNumber}` : `S${s.setNumber}`}:
                                    </span>
                                    <span className="font-extrabold">
                                      {s.completedRepsOrSec}{setEval.unit === 'sec' ? 's' : ''}
                                    </span>
                                    {setEval.targetNum > 0 && (
                                      <span className="text-[10px] opacity-75 font-normal">
                                        / {setEval.targetNum}{setEval.unit === 'sec' ? 's' : ''}
                                      </span>
                                    )}
                                    {setEval.isReached ? (
                                      <span className="text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                                        ✓{setEval.diff > 0 ? ` (+${setEval.diff})` : ''}
                                      </span>
                                    ) : (
                                      <span className="text-rose-600 dark:text-rose-400 font-bold text-xs">
                                        ({setEval.diff}) ✕
                                      </span>
                                    )}
                                    {s.weightKg ? (
                                      <span className="text-[10px] bg-zinc-200/80 dark:bg-zinc-700 px-1 rounded-md text-zinc-700 dark:text-zinc-200 ml-0.5">
                                        +{s.weightKg}kg
                                      </span>
                                    ) : null}
                                  </span>
                                );
                              })}
                            </div>

                            {item.notes && (
                              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 italic pt-1 border-t border-zinc-200/50 dark:border-zinc-700/50">
                                Nota: {item.notes}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* General session notes */}
                    {session.notes && (
                      <div className="p-2.5 rounded-xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 text-xs text-zinc-800 dark:text-zinc-200">
                        <span className="font-bold text-amber-600 dark:text-amber-400 block mb-0.5">
                          Note sessione:
                        </span>
                        {session.notes}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-2">
                      <button
                        type="button"
                        onClick={() => setSessionToDelete(session)}
                        className="text-xs font-semibold text-red-500 hover:text-red-700 flex items-center space-x-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Elimina</span>
                      </button>

                      <div className="flex items-center space-x-2">
                        {session.ptSummary && (
                          <>
                            <button
                              onClick={() =>
                                handleCopyPTSummary(session.ptSummary!, true)
                              }
                              className="px-3 py-1.5 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-semibold flex items-center space-x-1.5 shadow-xs cursor-pointer"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copia Report</span>
                            </button>
                            <button
                              onClick={() =>
                                handleWhatsAppShare(session.ptSummary!)
                              }
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-xs cursor-pointer"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                              <span>WhatsApp</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* SUCCESS MODAL AFTER SAVING RESULTS */}
      {savedSession && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-lg border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
            <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 text-center bg-gradient-to-b from-emerald-500/10 to-transparent">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white mx-auto flex items-center justify-center mb-2 shadow-md">
                <Check className="w-7 h-7 stroke-[3]" />
              </div>
              <h3 className="font-extrabold text-lg text-zinc-900 dark:text-zinc-100">
                Risultati Salvati nello Storico!
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                {savedSession.dayName} • {savedSession.date}
              </p>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Report per il Personal Trainer:
                  </span>
                  {copiedToast && (
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 animate-pulse">
                      Copiato negli appunti!
                    </span>
                  )}
                </div>
                <div className="p-3.5 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 font-mono text-[11px] text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap max-h-56 overflow-y-auto select-all">
                  {savedSession.ptSummary}
                </div>
              </div>

              {/* Share buttons */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() =>
                    handleCopyPTSummary(savedSession.ptSummary || '')
                  }
                  className="w-full py-2.5 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-bold text-xs flex items-center justify-center space-x-1.5 shadow-sm hover:opacity-90 active:scale-95 transition cursor-pointer"
                >
                  <Copy className="w-4 h-4" />
                  <span>Copia Report</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleWhatsAppShare(savedSession.ptSummary || '')
                  }
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-sm active:scale-95 transition cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Invia su WhatsApp</span>
                </button>
              </div>
            </div>

            <div className="p-4 bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setSavedSession(null);
                  setActiveSubTab('storico');
                }}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
              >
                Vai allo Storico
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Delete Session Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(sessionToDelete)}
        title="Elimina Sessione dallo Storico"
        message={
          sessionToDelete
            ? `Sei sicuro di voler eliminare la sessione di ${sessionToDelete.dayName} del ${sessionToDelete.date}? I dati salvati non potranno essere recuperati.`
            : ''
        }
        confirmLabel="Elimina Sessione"
        onConfirm={async () => {
          if (sessionToDelete) {
            const id = sessionToDelete.id;
            setSessionToDelete(null);
            await onDeleteSession(id);
          }
        }}
        onCancel={() => setSessionToDelete(null)}
      />
    </div>
  );
};

interface ExerciseResultsCardProps {
  item: LoggedExercise;
  onUpdateSetValue: (setIndex: number, val: number) => void;
  onUpdateWeight: (setIndex: number, weight: number) => void;
  onAddSet: () => void;
  onRemoveSet: () => void;
  onUpdateNotes: (notes: string) => void;
}

const ExerciseResultsCard: React.FC<ExerciseResultsCardProps> = ({
  item,
  onUpdateSetValue,
  onUpdateWeight,
  onAddSet,
  onRemoveSet,
  onUpdateNotes,
}) => {
  const [showNotes, setShowNotes] = useState(Boolean(item.notes));

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-3">
      {/* Exercise Title */}
      <div className="flex items-center justify-between">
        <div>
          {item.circuitName && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500 block">
              {item.circuitName}
            </span>
          )}
          <h4 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">
            {item.name}
          </h4>
        </div>

        {/* Set stepper control */}
        <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={onRemoveSet}
            disabled={item.sets.length <= 1}
            title="Rimuovi serie"
            className="p-1 rounded-md bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 disabled:opacity-20 cursor-pointer"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-bold text-zinc-500 px-1">
            {item.sets.length} serie
          </span>
          <button
            type="button"
            onClick={onAddSet}
            title="Aggiungi serie"
            className="p-1 rounded-md bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Sets Grid */}
      <div className="space-y-1.5">
        <div className="grid grid-cols-12 gap-2 text-[11px] font-bold text-zinc-400 px-1 uppercase tracking-wider">
          <span className="col-span-3 text-center">Serie</span>
          <span className="col-span-3 text-center">Target</span>
          <span className="col-span-3 text-center">Eseguite</span>
          <span className="col-span-3 text-center">Zav. (+kg)</span>
        </div>

        {item.sets.map((set, setIdx) => (
          <div
            key={setIdx}
            className="grid grid-cols-12 gap-2 items-center p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/70 dark:border-zinc-800"
          >
            {/* Set index */}
            <div className="col-span-3 text-center font-bold text-xs text-zinc-700 dark:text-zinc-300">
              {set.roundNumber ? `Giro ${set.roundNumber}` : `Set ${set.setNumber}`}
            </div>

            {/* Target */}
            <div className="col-span-3 text-center text-xs font-semibold text-zinc-500 dark:text-zinc-400 truncate">
              {set.target}
            </div>

            {/* Completed value input */}
            <div className="col-span-3 flex justify-center">
              <input
                type="number"
                min="0"
                max="999"
                value={set.completedRepsOrSec}
                onChange={(e) =>
                  onUpdateSetValue(setIdx, parseInt(e.target.value) || 0)
                }
                className="w-16 py-1.5 text-center font-extrabold text-sm rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Added weight in kg */}
            <div className="col-span-3 flex justify-center">
              <input
                type="number"
                min="0"
                step="0.5"
                value={set.weightKg || ''}
                placeholder="0"
                onChange={(e) =>
                  onUpdateWeight(setIdx, parseFloat(e.target.value) || 0)
                }
                className="w-16 py-1.5 text-center font-semibold text-xs rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Note option */}
      <div>
        {!showNotes ? (
          <button
            type="button"
            onClick={() => setShowNotes(true)}
            className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer"
          >
            + Aggiungi nota su questo esercizio
          </button>
        ) : (
          <textarea
            rows={1}
            value={item.notes || ''}
            onChange={(e) => onUpdateNotes(e.target.value)}
            placeholder="Note es. esecuzione pulita, zavorra gestita bene..."
            className="w-full px-3 py-1.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 resize-none"
          />
        )}
      </div>
    </div>
  );
};
