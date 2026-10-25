import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  writeBatch,
  getDocs,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  WorkoutDay,
  WorkoutSession,
  WeightEntry,
  ExportPayload,
} from '../types';

/**
 * Workout Days Subcollection: /users/{userId}/days/{dayId}
 */
export function subscribeWorkoutDays(
  userId: string,
  onUpdate: (days: WorkoutDay[]) => void,
  onError?: (err: unknown) => void
) {
  const path = `users/${userId}/days`;
  try {
    const q = query(collection(db, path), orderBy('order', 'asc'));
    return onSnapshot(
      q,
      (snapshot) => {
        const days: WorkoutDay[] = [];
        snapshot.forEach((docSnap) => {
          days.push(docSnap.data() as WorkoutDay);
        });
        onUpdate(days);
      },
      (error) => {
        if (onError) onError(error);
        handleFirestoreError(error, OperationType.GET, path);
      }
    );
  } catch (err) {
    if (onError) onError(err);
    handleFirestoreError(err, OperationType.GET, path);
  }
}

function cleanPayload<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export async function saveWorkoutDay(userId: string, day: WorkoutDay): Promise<void> {
  const path = `users/${userId}/days/${day.id}`;
  try {
    const cleanDay = cleanPayload({
      ...day,
      userId,
      updatedAt: new Date().toISOString(),
    });
    await setDoc(doc(db, 'users', userId, 'days', day.id), cleanDay);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteWorkoutDay(userId: string, dayId: string): Promise<void> {
  const path = `users/${userId}/days/${dayId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'days', dayId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

/**
 * Workout Sessions Subcollection: /users/{userId}/sessions/{sessionId}
 */
export function subscribeWorkoutSessions(
  userId: string,
  onUpdate: (sessions: WorkoutSession[]) => void,
  onError?: (err: unknown) => void
) {
  const path = `users/${userId}/sessions`;
  try {
    const q = query(collection(db, path), orderBy('date', 'desc'));
    return onSnapshot(
      q,
      (snapshot) => {
        const sessions: WorkoutSession[] = [];
        snapshot.forEach((docSnap) => {
          sessions.push(docSnap.data() as WorkoutSession);
        });
        onUpdate(sessions);
      },
      (error) => {
        if (onError) onError(error);
        handleFirestoreError(error, OperationType.GET, path);
      }
    );
  } catch (err) {
    if (onError) onError(err);
    handleFirestoreError(err, OperationType.GET, path);
  }
}

export async function saveWorkoutSession(
  userId: string,
  session: WorkoutSession
): Promise<void> {
  const path = `users/${userId}/sessions/${session.id}`;
  try {
    const cleanSession = cleanPayload({
      ...session,
      userId,
      createdAt: session.createdAt || new Date().toISOString(),
    });
    await setDoc(doc(db, 'users', userId, 'sessions', session.id), cleanSession);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteWorkoutSession(
  userId: string,
  sessionId: string
): Promise<void> {
  const path = `users/${userId}/sessions/${sessionId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'sessions', sessionId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

/**
 * Weight Tracking Subcollection: /users/{userId}/weight_entries/{entryId}
 */
export function subscribeWeightEntries(
  userId: string,
  onUpdate: (entries: WeightEntry[]) => void,
  onError?: (err: unknown) => void
) {
  const path = `users/${userId}/weight_entries`;
  try {
    const q = query(collection(db, path), orderBy('date', 'asc'));
    return onSnapshot(
      q,
      (snapshot) => {
        const entries: WeightEntry[] = [];
        snapshot.forEach((docSnap) => {
          entries.push(docSnap.data() as WeightEntry);
        });
        onUpdate(entries);
      },
      (error) => {
        if (onError) onError(error);
        handleFirestoreError(error, OperationType.GET, path);
      }
    );
  } catch (err) {
    if (onError) onError(err);
    handleFirestoreError(err, OperationType.GET, path);
  }
}

export async function saveWeightEntry(
  userId: string,
  entry: WeightEntry
): Promise<void> {
  const path = `users/${userId}/weight_entries/${entry.id}`;
  try {
    const cleanEntry = cleanPayload({
      ...entry,
      userId,
      createdAt: entry.createdAt || new Date().toISOString(),
    });
    await setDoc(doc(db, 'users', userId, 'weight_entries', entry.id), cleanEntry);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteWeightEntry(
  userId: string,
  entryId: string
): Promise<void> {
  const path = `users/${userId}/weight_entries/${entryId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'weight_entries', entryId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

/**
 * Export and Import full user data
 */
export async function exportUserData(
  userId: string,
  days: WorkoutDay[],
  sessions: WorkoutSession[],
  weightEntries: WeightEntry[]
): Promise<ExportPayload> {
  return {
    version: 1,
    exportDate: new Date().toISOString(),
    app: 'La mia scheda',
    days,
    sessions,
    weightEntries,
  };
}

export async function importUserData(
  userId: string,
  payload: ExportPayload
): Promise<{ daysCount: number; sessionsCount: number; weightCount: number }> {
  const batch = writeBatch(db);

  let daysCount = 0;
  for (const day of payload.days) {
    const dayRef = doc(db, 'users', userId, 'days', day.id);
    batch.set(dayRef, { ...day, userId, updatedAt: new Date().toISOString() });
    daysCount++;
  }

  let sessionsCount = 0;
  for (const session of payload.sessions) {
    const sessionRef = doc(db, 'users', userId, 'sessions', session.id);
    batch.set(sessionRef, { ...session, userId });
    sessionsCount++;
  }

  let weightCount = 0;
  for (const entry of payload.weightEntries) {
    const entryRef = doc(db, 'users', userId, 'weight_entries', entry.id);
    batch.set(entryRef, { ...entry, userId });
    weightCount++;
  }

  await batch.commit();
  return { daysCount, sessionsCount, weightCount };
}
