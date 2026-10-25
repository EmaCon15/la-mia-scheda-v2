export type TargetType = 'reps' | 'duration';

export interface ExerciseItem {
  id: string;
  type: 'exercise';
  name: string;
  sets: number;
  targetType: TargetType;
  targetValue: number; // e.g., 8 reps or 45 seconds
  restSeconds: number; // rest time between sets in seconds
  notes?: string;
}

export interface CircuitExercise {
  id: string;
  name: string;
  targetType: TargetType;
  targetValue: number;
  restSeconds: number; // rest between exercises (often 0-30s)
  notes?: string;
}

export interface CircuitItem {
  id: string;
  type: 'circuit';
  name: string;
  rounds: number; // number of rounds (giri)
  restBetweenExercises: number; // recovery between exercises in sec
  restBetweenRounds: number; // recovery between rounds in sec
  exercises: CircuitExercise[];
  notes?: string;
}

export type SectionItem = ExerciseItem | CircuitItem;

export interface WorkoutDay {
  id: string;
  userId: string;
  name: string; // e.g. "Lunedì - Spinta & Core" or "Giorno A"
  order: number;
  absItems: SectionItem[];
  workoutItems: SectionItem[];
  createdAt: string;
  updatedAt: string;
}

export interface LoggedSet {
  setNumber: number;
  roundNumber?: number;
  target: string; // e.g. "4x8 reps" or "3x45s"
  completedRepsOrSec: number;
  weightKg?: number; // extra weight / zavorra in kg
  completed: boolean;
  notes?: string;
}

export interface LoggedExercise {
  itemId: string;
  name: string;
  section: 'abs' | 'workout';
  circuitName?: string;
  isCircuit?: boolean;
  sets: LoggedSet[];
  notes?: string;
}

export interface WorkoutSession {
  id: string;
  userId: string;
  dayId?: string;
  dayName: string;
  date: string; // YYYY-MM-DD
  startTime?: string;
  endTime?: string;
  durationSeconds?: number;
  durationMinutes?: number;
  completedItems: LoggedExercise[];
  notes?: string;
  ptSummary?: string;
  createdAt: string;
}

export interface WeightEntry {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  weightKg: number;
  notes?: string;
  createdAt: string;
}

export interface WeightEntryWithDelta extends WeightEntry {
  delta: number | null; // difference from previous entry
}

export interface UserProfile {
  userId: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  theme?: 'dark' | 'light' | 'system';
  soundEnabled?: boolean;
  updatedAt?: string;
}

export interface ExportPayload {
  version: number;
  exportDate: string;
  app: string;
  days: WorkoutDay[];
  sessions: WorkoutSession[];
  weightEntries: WeightEntry[];
}
