import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/Navbar';
import { BottomNav, TabType } from './components/BottomNav';
import { RoutineView } from './components/routine/RoutineView';
import { LogWorkoutView } from './components/workout/LogWorkoutView';
import { WeightView } from './components/weight/WeightView';
import { SettingsView } from './components/settings/SettingsView';
import {
  WorkoutDay,
  WorkoutSession,
  WeightEntry,
} from './types';
import {
  subscribeWorkoutDays,
  subscribeWorkoutSessions,
  subscribeWeightEntries,
  fetchWorkoutDaysOnce,
  fetchWorkoutSessionsOnce,
  fetchWeightEntriesOnce,
  saveWorkoutDay,
  deleteWorkoutDay,
  saveWorkoutSession,
  deleteWorkoutSession,
  saveWeightEntry,
  deleteWeightEntry,
} from './services/firestoreService';
import { getDefaultCalisthenicsTemplate } from './utils/workoutUtils';
import { AlertCircle } from 'lucide-react';
import { OfflineIndicator } from './components/pwa/OfflineIndicator';

const LOCAL_STORAGE_DAYS_KEY = 'lms_local_days';
const LOCAL_STORAGE_SESSIONS_KEY = 'lms_local_sessions';
const LOCAL_STORAGE_WEIGHT_KEY = 'lms_local_weight';

function loadStoredArray<T>(primaryKey: string, fallbackKey: string): T[] {
  try {
    const rawPrimary = localStorage.getItem(primaryKey);
    if (rawPrimary) {
      const parsed = JSON.parse(rawPrimary);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
    const rawFallback = localStorage.getItem(fallbackKey);
    if (rawFallback) {
      const parsed = JSON.parse(rawFallback);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
    // Scan all keys as extra safety net
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.endsWith(primaryKey.substring(primaryKey.lastIndexOf('_')))) {
        const val = localStorage.getItem(k);
        if (val) {
          const parsed = JSON.parse(val);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      }
    }
  } catch {
    // ignore
  }
  return [];
}

function MainAppContent() {
  const { currentUser, loading: authLoading, signInWithGoogle } = useAuth();

  const [activeTab, setActiveTab] = useState<TabType>('scheda');
  const [preselectedDayId, setPreselectedDayId] = useState<string | null>(null);

  // Synchronous instant retrieval from localStorage on startup - eliminating empty flashes or lost state
  const [days, setDays] = useState<WorkoutDay[]>(() =>
    loadStoredArray<WorkoutDay>(
      currentUser ? `lms_user_${currentUser.uid}_days` : LOCAL_STORAGE_DAYS_KEY,
      LOCAL_STORAGE_DAYS_KEY
    )
  );
  const [sessions, setSessions] = useState<WorkoutSession[]>(() =>
    loadStoredArray<WorkoutSession>(
      currentUser ? `lms_user_${currentUser.uid}_sessions` : LOCAL_STORAGE_SESSIONS_KEY,
      LOCAL_STORAGE_SESSIONS_KEY
    )
  );
  const [weightEntries, setWeightEntries] = useState<WeightEntry[]>(() =>
    loadStoredArray<WeightEntry>(
      currentUser ? `lms_user_${currentUser.uid}_weights` : LOCAL_STORAGE_WEIGHT_KEY,
      LOCAL_STORAGE_WEIGHT_KEY
    )
  );
  const [dataLoading, setDataLoading] = useState(false);

  // Immediately populate state from user-specific cache whenever currentUser is identified
  useEffect(() => {
    if (currentUser) {
      const userDaysKey = `lms_user_${currentUser.uid}_days`;
      const userSessionsKey = `lms_user_${currentUser.uid}_sessions`;
      const userWeightKey = `lms_user_${currentUser.uid}_weights`;

      const cachedDays = loadStoredArray<WorkoutDay>(userDaysKey, LOCAL_STORAGE_DAYS_KEY);
      if (cachedDays.length > 0) {
        setDays(cachedDays);
      }
      const cachedSessions = loadStoredArray<WorkoutSession>(userSessionsKey, LOCAL_STORAGE_SESSIONS_KEY);
      if (cachedSessions.length > 0) {
        setSessions(cachedSessions);
      }
      const cachedWeights = loadStoredArray<WeightEntry>(userWeightKey, LOCAL_STORAGE_WEIGHT_KEY);
      if (cachedWeights.length > 0) {
        setWeightEntries(cachedWeights);
      }
    }
  }, [currentUser?.uid]);

  // Synchronize with Firestore when user is authenticated
  useEffect(() => {
    if (authLoading) return;

    if (currentUser) {
      const userDaysKey = `lms_user_${currentUser.uid}_days`;
      const userSessionsKey = `lms_user_${currentUser.uid}_sessions`;
      const userWeightKey = `lms_user_${currentUser.uid}_weights`;

      // 1. Direct fetch fallback with safe error preservation
      fetchWorkoutDaysOnce(currentUser.uid).then(async (fetched) => {
        if (fetched.length > 0) {
          setDays(fetched);
          try {
            localStorage.setItem(userDaysKey, JSON.stringify(fetched));
            localStorage.setItem(LOCAL_STORAGE_DAYS_KEY, JSON.stringify(fetched));
          } catch {
            // ignore
          }
        } else {
          // If cloud has 0 days returned, check if we have local days to upload to account
          const existingToUpload = loadStoredArray<WorkoutDay>(userDaysKey, LOCAL_STORAGE_DAYS_KEY);
          if (existingToUpload.length > 0) {
            setDays(existingToUpload);
            for (const d of existingToUpload) {
              try {
                await saveWorkoutDay(currentUser.uid, d);
              } catch {
                // If cloud write fails (e.g. offline/token pending), keep local copy safe
              }
            }
          }
        }
      }).catch((err) => {
        console.info('fetchWorkoutDays notice:', err);
      });

      fetchWorkoutSessionsOnce(currentUser.uid).then(async (fetched) => {
        if (fetched.length > 0) {
          setSessions(fetched);
          try {
            localStorage.setItem(userSessionsKey, JSON.stringify(fetched));
            localStorage.setItem(LOCAL_STORAGE_SESSIONS_KEY, JSON.stringify(fetched));
          } catch {
            // ignore
          }
        } else {
          const existingToUpload = loadStoredArray<WorkoutSession>(userSessionsKey, LOCAL_STORAGE_SESSIONS_KEY);
          if (existingToUpload.length > 0) {
            setSessions(existingToUpload);
            for (const s of existingToUpload) {
              try {
                await saveWorkoutSession(currentUser.uid, s);
              } catch {
                // Keep local copy safe
              }
            }
          }
        }
      }).catch((err) => {
        console.info('fetchWorkoutSessions notice:', err);
      });

      fetchWeightEntriesOnce(currentUser.uid).then(async (fetched) => {
        if (fetched.length > 0) {
          setWeightEntries(fetched);
          try {
            localStorage.setItem(userWeightKey, JSON.stringify(fetched));
            localStorage.setItem(LOCAL_STORAGE_WEIGHT_KEY, JSON.stringify(fetched));
          } catch {
            // ignore
          }
        } else {
          const existingToUpload = loadStoredArray<WeightEntry>(userWeightKey, LOCAL_STORAGE_WEIGHT_KEY);
          if (existingToUpload.length > 0) {
            setWeightEntries(existingToUpload);
            for (const w of existingToUpload) {
              try {
                await saveWeightEntry(currentUser.uid, w);
              } catch {
                // Keep local copy safe
              }
            }
          }
        }
      }).catch((err) => {
        console.info('fetchWeightEntries notice:', err);
      });

      // 2. Real-time Firestore Subscriptions
      const unsubDays = subscribeWorkoutDays(
        currentUser.uid,
        (fetchedDays) => {
          if (fetchedDays.length > 0) {
            setDays(fetchedDays);
            try {
              localStorage.setItem(userDaysKey, JSON.stringify(fetchedDays));
              localStorage.setItem(LOCAL_STORAGE_DAYS_KEY, JSON.stringify(fetchedDays));
            } catch {
              // ignore
            }
          }
        },
        (err) => console.info('Days sync notice:', err)
      );

      const unsubSessions = subscribeWorkoutSessions(
        currentUser.uid,
        (fetchedSessions) => {
          if (fetchedSessions.length > 0) {
            setSessions(fetchedSessions);
            try {
              localStorage.setItem(userSessionsKey, JSON.stringify(fetchedSessions));
              localStorage.setItem(LOCAL_STORAGE_SESSIONS_KEY, JSON.stringify(fetchedSessions));
            } catch {
              // ignore
            }
          }
        },
        (err) => console.info('Sessions sync notice:', err)
      );

      const unsubWeight = subscribeWeightEntries(
        currentUser.uid,
        (fetchedWeights) => {
          if (fetchedWeights.length > 0) {
            setWeightEntries(fetchedWeights);
            try {
              localStorage.setItem(userWeightKey, JSON.stringify(fetchedWeights));
              localStorage.setItem(LOCAL_STORAGE_WEIGHT_KEY, JSON.stringify(fetchedWeights));
            } catch {
              // ignore
            }
          }
        },
        (err) => console.info('Weight sync notice:', err)
      );

      return () => {
        if (unsubDays) unsubDays();
        if (unsubSessions) unsubSessions();
        if (unsubWeight) unsubWeight();
      };
    } else {
      // Local fallback for guest / offline mode
      const localDays = loadStoredArray<WorkoutDay>(LOCAL_STORAGE_DAYS_KEY, LOCAL_STORAGE_DAYS_KEY);
      if (localDays.length > 0 && days.length === 0) setDays(localDays);

      const localSessions = loadStoredArray<WorkoutSession>(LOCAL_STORAGE_SESSIONS_KEY, LOCAL_STORAGE_SESSIONS_KEY);
      if (localSessions.length > 0 && sessions.length === 0) setSessions(localSessions);

      const localWeights = loadStoredArray<WeightEntry>(LOCAL_STORAGE_WEIGHT_KEY, LOCAL_STORAGE_WEIGHT_KEY);
      if (localWeights.length > 0 && weightEntries.length === 0) setWeightEntries(localWeights);
    }
  }, [currentUser, authLoading]);

  // Sync cache locally whenever data changes
  useEffect(() => {
    const daysKey = currentUser ? `lms_user_${currentUser.uid}_days` : LOCAL_STORAGE_DAYS_KEY;
    const sessionsKey = currentUser ? `lms_user_${currentUser.uid}_sessions` : LOCAL_STORAGE_SESSIONS_KEY;
    const weightKey = currentUser ? `lms_user_${currentUser.uid}_weights` : LOCAL_STORAGE_WEIGHT_KEY;

    try {
      if (days.length > 0) {
        localStorage.setItem(daysKey, JSON.stringify(days));
        localStorage.setItem(LOCAL_STORAGE_DAYS_KEY, JSON.stringify(days));
      }
      if (sessions.length > 0) {
        localStorage.setItem(sessionsKey, JSON.stringify(sessions));
        localStorage.setItem(LOCAL_STORAGE_SESSIONS_KEY, JSON.stringify(sessions));
      }
      if (weightEntries.length > 0) {
        localStorage.setItem(weightKey, JSON.stringify(weightEntries));
        localStorage.setItem(LOCAL_STORAGE_WEIGHT_KEY, JSON.stringify(weightEntries));
      }
    } catch {
      // ignore
    }
  }, [currentUser, days, sessions, weightEntries]);

  // Save / Delete Day
  const handleSaveDay = async (day: WorkoutDay) => {
    setDays((prev) => {
      const index = prev.findIndex((d) => d.id === day.id);
      if (index >= 0) {
        const updated = [...prev];
        updated[index] = day;
        return updated;
      }
      return [...prev, day];
    });

    if (currentUser) {
      await saveWorkoutDay(currentUser.uid, day);
    }
  };

  const handleDeleteDay = async (dayId: string) => {
    const updated = days.filter((d) => d.id !== dayId);
    setDays(updated);
    const daysKey = currentUser ? `lms_user_${currentUser.uid}_days` : LOCAL_STORAGE_DAYS_KEY;
    localStorage.setItem(daysKey, JSON.stringify(updated));
    localStorage.setItem(LOCAL_STORAGE_DAYS_KEY, JSON.stringify(updated));
    if (currentUser) {
      await deleteWorkoutDay(currentUser.uid, dayId);
    }
  };

  // Switch to Log view with preselected day
  const handleLogWorkout = (day: WorkoutDay) => {
    setPreselectedDayId(day.id);
    setActiveTab('registro');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveSession = async (session: WorkoutSession) => {
    setSessions((prev) => [session, ...prev.filter((s) => s.id !== session.id)]);
    if (currentUser) {
      await saveWorkoutSession(currentUser.uid, session);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    const updated = sessions.filter((s) => s.id !== sessionId);
    setSessions(updated);
    const sessionsKey = currentUser ? `lms_user_${currentUser.uid}_sessions` : LOCAL_STORAGE_SESSIONS_KEY;
    localStorage.setItem(sessionsKey, JSON.stringify(updated));
    localStorage.setItem(LOCAL_STORAGE_SESSIONS_KEY, JSON.stringify(updated));
    if (currentUser) {
      await deleteWorkoutSession(currentUser.uid, sessionId);
    }
  };

  // Weight entry Handlers
  const handleSaveWeight = async (entry: WeightEntry) => {
    setWeightEntries((prev) => {
      const index = prev.findIndex((w) => w.id === entry.id);
      if (index >= 0) {
        const updated = [...prev];
        updated[index] = entry;
        return updated;
      }
      return [entry, ...prev];
    });
    if (currentUser) {
      await saveWeightEntry(currentUser.uid, entry);
    }
  };

  const handleDeleteWeight = async (entryId: string) => {
    const updated = weightEntries.filter((w) => w.id !== entryId);
    setWeightEntries(updated);
    const weightKey = currentUser ? `lms_user_${currentUser.uid}_weights` : LOCAL_STORAGE_WEIGHT_KEY;
    localStorage.setItem(weightKey, JSON.stringify(updated));
    localStorage.setItem(LOCAL_STORAGE_WEIGHT_KEY, JSON.stringify(updated));
    if (currentUser) {
      await deleteWeightEntry(currentUser.uid, entryId);
    }
  };

  // Load Calisthenics Example Template
  const handleLoadExampleTemplate = async () => {
    const templateDays = getDefaultCalisthenicsTemplate(
      currentUser ? currentUser.uid : 'local'
    );
    for (const day of templateDays) {
      await handleSaveDay(day);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors flex flex-col font-sans">
      <Navbar />
      <OfflineIndicator />

      {/* Guest Banner if not logged in */}
      {!currentUser && !authLoading && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-xs text-amber-800 dark:text-amber-200">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <span className="flex items-center space-x-1.5">
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
              <span>
                Modalità locale. Accedi con Google per sincronizzare i tuoi allenamenti sul Cloud.
              </span>
            </span>
            <button
              onClick={signInWithGoogle}
              className="font-bold underline hover:text-amber-600 dark:hover:text-amber-300 ml-2 cursor-pointer shrink-0"
            >
              Accedi ora
            </button>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-5">
        {activeTab === 'scheda' && (
          <RoutineView
            days={days}
            onSaveDay={handleSaveDay}
            onDeleteDay={handleDeleteDay}
            onLogWorkout={handleLogWorkout}
            onLoadExampleTemplate={handleLoadExampleTemplate}
            loading={dataLoading}
          />
        )}

        {activeTab === 'registro' && (
          <LogWorkoutView
            days={days}
            sessions={sessions}
            onSaveSession={handleSaveSession}
            onDeleteSession={handleDeleteSession}
            preselectedDayId={preselectedDayId}
            onClearPreselectedDay={() => setPreselectedDayId(null)}
            loading={dataLoading}
          />
        )}

        {activeTab === 'peso' && (
          <WeightView
            entries={weightEntries}
            onSaveWeight={handleSaveWeight}
            onDeleteWeight={handleDeleteWeight}
            loading={dataLoading}
          />
        )}

        {activeTab === 'impostazioni' && (
          <SettingsView
            days={days}
            sessions={sessions}
            weightEntries={weightEntries}
            onLoadExampleTemplate={handleLoadExampleTemplate}
          />
        )}
      </main>

      <BottomNav
        activeTab={activeTab}
        onSelectTab={(tab) => {
          if (tab !== 'registro') {
            setPreselectedDayId(null);
          }
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainAppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
