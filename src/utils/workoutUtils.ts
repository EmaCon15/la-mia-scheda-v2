import {
  WorkoutSession,
  WeightEntry,
  WeightEntryWithDelta,
  ExportPayload,
  SectionItem,
  LoggedExercise,
  LoggedSet,
} from '../types';

/**
 * Format seconds into mm:ss or hh:mm:ss string
 */
export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const totalSec = Math.floor(seconds);
  const hrs = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;

  const paddedMins = mins.toString().padStart(2, '0');
  const paddedSecs = secs.toString().padStart(2, '0');

  if (hrs > 0) {
    const paddedHrs = hrs.toString().padStart(2, '0');
    return `${paddedHrs}:${paddedMins}:${paddedSecs}`;
  }
  return `${paddedMins}:${paddedSecs}`;
}

/**
 * Format seconds for human readable description (e.g. 90s -> "1m 30s", 45s -> "45s")
 */
export function formatDurationHuman(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  if (remaining === 0) return `${mins}m`;
  return `${mins}m ${remaining}s`;
}

/**
 * Calculate deltas between chronological weight entries
 */
export function calculateWeightDelta(entries: WeightEntry[]): WeightEntryWithDelta[] {
  if (!entries || entries.length === 0) return [];

  // Sort ascending by date to calculate deltas accurately
  const sorted = [...entries].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const withDelta: WeightEntryWithDelta[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i];
    let delta: number | null = null;
    if (i > 0) {
      const prev = sorted[i - 1];
      delta = Number((current.weightKg - prev.weightKg).toFixed(1));
    }
    withDelta.push({
      ...current,
      delta,
    });
  }

  // Return descending (most recent first) for display convenience
  return withDelta.reverse();
}

/**
 * Generate a beautifully formatted text summary for sharing with Personal Trainer
 */
export function generatePTSummary(session: WorkoutSession): string {
  const dateFormatted = session.date || new Date().toISOString().split('T')[0];

  let summary = `🏋️‍♂️ *REPORT ALLENAMENTO CALISTHENICS*\n`;
  summary += `📅 *Data:* ${dateFormatted}\n`;
  summary += `📌 *Giorno:* ${session.dayName}\n`;
  if (session.durationMinutes) {
    summary += `⏱️ *Durata stimata:* ${session.durationMinutes} min\n`;
  } else if (session.durationSeconds && session.durationSeconds > 0) {
    summary += `⏱️ *Durata:* ${formatTime(session.durationSeconds)}\n`;
  }

  const absItems = session.completedItems.filter((i) => i.section === 'abs');
  const workoutItems = session.completedItems.filter((i) => i.section === 'workout');

  if (absItems.length > 0) {
    summary += `\n🔥 *SEZIONE ABS*\n`;
    for (const item of absItems) {
      const prefix = item.circuitName ? `[${item.circuitName}] ` : '';
      summary += `• *${prefix}${item.name}*\n`;
      for (const set of item.sets) {
        if (!set.completed) continue;
        const weightText = set.weightKg ? ` (+${set.weightKg}kg)` : '';
        const targetTypeIndicator = set.target.includes('s') ? 's' : ' rip';
        summary += `   Set ${set.setNumber}: ${set.completedRepsOrSec}${targetTypeIndicator}${weightText}\n`;
      }
      if (item.notes && item.notes.trim()) {
        summary += `   📝 Note: ${item.notes.trim()}\n`;
      }
    }
  }

  if (workoutItems.length > 0) {
    summary += `\n💪 *SEZIONE WORKOUT*\n`;
    for (const item of workoutItems) {
      const prefix = item.circuitName ? `[${item.circuitName}] ` : '';
      summary += `• *${prefix}${item.name}*\n`;
      for (const set of item.sets) {
        if (!set.completed) continue;
        const weightText = set.weightKg ? ` (+${set.weightKg}kg)` : '';
        const targetTypeIndicator = set.target.includes('s') ? 's' : ' rip';
        summary += `   Set ${set.setNumber}: ${set.completedRepsOrSec}${targetTypeIndicator}${weightText}\n`;
      }
      if (item.notes && item.notes.trim()) {
        summary += `   📝 Note: ${item.notes.trim()}\n`;
      }
    }
  }

  if (session.notes && session.notes.trim()) {
    summary += `\n📝 *NOTE GENERALI:*\n${session.notes.trim()}\n`;
  }

  summary += `\n_Generato con La mia scheda - Calisthenics App_`;

  return summary;
}

/**
 * Reorder items in an array
 */
export function reorderItems<T>(list: T[], startIndex: number, endIndex: number): T[] {
  if (startIndex < 0 || startIndex >= list.length) return list;
  if (endIndex < 0 || endIndex >= list.length) return list;
  if (startIndex === endIndex) return list;

  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
}

/**
 * Validate imported JSON file
 */
export function validateImportData(
  jsonString: string
): { valid: boolean; data?: ExportPayload; error?: string } {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed || typeof parsed !== 'object') {
      return { valid: false, error: 'Il file JSON non è valido.' };
    }

    if (!Array.isArray(parsed.days) && !Array.isArray(parsed.sessions) && !Array.isArray(parsed.weightEntries)) {
      return {
        valid: false,
        error: 'Il file importato non contiene schede, registri o pesate valide.',
      };
    }

    const payload: ExportPayload = {
      version: parsed.version || 1,
      exportDate: parsed.exportDate || new Date().toISOString(),
      app: parsed.app || 'La mia scheda',
      days: Array.isArray(parsed.days) ? parsed.days : [],
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
      weightEntries: Array.isArray(parsed.weightEntries) ? parsed.weightEntries : [],
    };

    return { valid: true, data: payload };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { valid: false, error: `Errore nella lettura del JSON: ${message}` };
  }
}

/**
 * Template Calisthenics Routine for beginners/intermediates
 */
export function getDefaultCalisthenicsTemplate(userId: string) {
  const now = new Date().toISOString();
  return [
    {
      id: `day-a-${Date.now()}`,
      userId,
      name: 'Giorno A - Spinta & Core (Push)',
      order: 1,
      createdAt: now,
      updatedAt: now,
      absItems: [
        {
          id: 'abs-1',
          type: 'circuit' as const,
          name: 'Circuito Hollow & Core',
          rounds: 3,
          restBetweenExercises: 10,
          restBetweenRounds: 60,
          exercises: [
            {
              id: 'abs-ex-1',
              name: 'Hollow Body Hold',
              targetType: 'duration' as const,
              targetValue: 30,
              restSeconds: 10,
            },
            {
              id: 'abs-ex-2',
              name: 'Arch Body / Superman Hold',
              targetType: 'duration' as const,
              targetValue: 30,
              restSeconds: 10,
            },
            {
              id: 'abs-ex-3',
              name: 'Plank a braccia tese',
              targetType: 'duration' as const,
              targetValue: 45,
              restSeconds: 60,
            },
          ],
        },
      ],
      workoutItems: [
        {
          id: 'w-1',
          type: 'exercise' as const,
          name: 'Dip alle parallele',
          sets: 4,
          targetType: 'reps' as const,
          targetValue: 8,
          restSeconds: 120,
          notes: 'Discesa controllata, petto leggermente inclinato in avanti',
        },
        {
          id: 'w-2',
          type: 'exercise' as const,
          name: 'Push-up regolari / Diamond',
          sets: 4,
          targetType: 'reps' as const,
          targetValue: 12,
          restSeconds: 90,
          notes: 'Gomiti a 45 gradi, scapole protratte in chiusura',
        },
        {
          id: 'w-3',
          type: 'exercise' as const,
          name: 'Pike Push-up (Focus Spalle)',
          sets: 3,
          targetType: 'reps' as const,
          targetValue: 8,
          restSeconds: 90,
          notes: 'Testa in avanti tra le mani formando un triangolo',
        },
      ],
    },
    {
      id: `day-b-${Date.now() + 1}`,
      userId,
      name: 'Giorno B - Trazione & Gambe (Pull)',
      order: 2,
      createdAt: now,
      updatedAt: now,
      absItems: [
        {
          id: 'abs-b-1',
          type: 'exercise' as const,
          name: 'Sollevamento ginocchia alla sbarra (Knee Raises)',
          sets: 3,
          targetType: 'reps' as const,
          targetValue: 12,
          restSeconds: 60,
          notes: 'Evitare oscillazioni, salita controllata',
        },
        {
          id: 'abs-b-2',
          type: 'exercise' as const,
          name: 'L-Sit a terra o sui rialzi',
          sets: 3,
          targetType: 'duration' as const,
          targetValue: 15,
          restSeconds: 60,
        },
      ],
      workoutItems: [
        {
          id: 'w-b-1',
          type: 'exercise' as const,
          name: 'Pull-up alla sbarra (Trazioni prone)',
          sets: 4,
          targetType: 'reps' as const,
          targetValue: 6,
          restSeconds: 120,
          notes: 'Mento sopra la sbarra, discesa completa senza rimbalzo',
        },
        {
          id: 'w-b-2',
          type: 'exercise' as const,
          name: 'Australian Pull-up (Trazioni orizzontali)',
          sets: 4,
          targetType: 'reps' as const,
          targetValue: 10,
          restSeconds: 90,
        },
        {
          id: 'w-b-3',
          type: 'exercise' as const,
          name: 'Pistol Squat assistiti o Bulgarian Split Squat',
          sets: 3,
          targetType: 'reps' as const,
          targetValue: 8,
          restSeconds: 90,
        },
      ],
    },
  ];
}

/**
 * Evaluates whether an individual logged set met or exceeded its target
 */
export interface SetTargetEvaluation {
  targetNum: number;
  completedNum: number;
  diff: number;
  isReached: boolean;
  unit: 'rip' | 'sec';
}

export function evaluateSetTarget(set: LoggedSet): SetTargetEvaluation {
  // Extract the numeric target from strings such as "8 rip", "30 s", "12", "3x8"
  const match = set.target ? set.target.match(/(\d+)/) : null;
  const targetNum = match ? parseInt(match[1], 10) : 0;
  const completedNum = Number(set.completedRepsOrSec) || 0;
  const diff = completedNum - targetNum;
  const isSeconds = Boolean(
    set.target && (set.target.includes('s') || set.target.includes('sec'))
  );
  const unit: 'rip' | 'sec' = isSeconds ? 'sec' : 'rip';
  const isReached = targetNum > 0 ? completedNum >= targetNum : true;

  return {
    targetNum,
    completedNum,
    diff,
    isReached,
    unit,
  };
}

/**
 * Evaluates whether an entire exercise met its targets across all completed sets
 */
export interface ExerciseTargetEvaluation {
  isFullyReached: boolean;
  reachedSetsCount: number;
  totalSetsCount: number;
  hasTargetData: boolean;
}

export function evaluateExerciseTarget(
  exercise: LoggedExercise
): ExerciseTargetEvaluation {
  const activeSets = exercise.sets.filter((s) => s.completed);
  if (activeSets.length === 0) {
    return {
      isFullyReached: false,
      reachedSetsCount: 0,
      totalSetsCount: 0,
      hasTargetData: false,
    };
  }

  let reachedCount = 0;
  let hasTargetData = false;

  for (const s of activeSets) {
    const evalResult = evaluateSetTarget(s);
    if (evalResult.targetNum > 0) {
      hasTargetData = true;
      if (evalResult.isReached) {
        reachedCount++;
      }
    } else {
      reachedCount++;
    }
  }

  return {
    isFullyReached: reachedCount === activeSets.length,
    reachedSetsCount: reachedCount,
    totalSetsCount: activeSets.length,
    hasTargetData,
  };
}

/**
 * Evaluates all exercises in a workout session
 */
export function evaluateSessionTargets(session: WorkoutSession): {
  fullyReachedExercises: number;
  totalExercises: number;
  allTargetsReached: boolean;
} {
  const exercises = session.completedItems || [];
  if (exercises.length === 0) {
    return { fullyReachedExercises: 0, totalExercises: 0, allTargetsReached: false };
  }

  let fullyReachedCount = 0;
  for (const ex of exercises) {
    const res = evaluateExerciseTarget(ex);
    if (res.isFullyReached) {
      fullyReachedCount++;
    }
  }

  return {
    fullyReachedExercises: fullyReachedCount,
    totalExercises: exercises.length,
    allTargetsReached: fullyReachedCount === exercises.length,
  };
}

