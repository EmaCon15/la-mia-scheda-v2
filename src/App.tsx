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

const LOCAL_STORAGE_DAYS_KEY = 'lms_local_days';
const LOCAL_STORAGE_SESSIONS_KEY = 'lms_local_sessions';
const LOCAL_STORAGE_WEIGHT_KEY = 'lms_local_weight';

function MainAppContent() {
  const { currentUser, loading: authLoading, signInWithGoogle } = useAuth();

  const [activeTab, setActiveTab] = useState<TabType>('scheda');
  const [preselectedDayId, setPreselectedDayId] = useState<string | null>(null);

  // Data states
  const [days, setDays] = useState<WorkoutDay[]>([]);
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [weightEntries, setWeightEntries] = useState<WeightEntry[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  // Subscribe to Firestore when user is authenticated, or load from localStorage with instant cached startup
  useEffect(() => {
    if (authLoading) return;

    if (currentUser) {
      // 1. Instant recovery from user-specific cache (eliminates empty screen on reload)
      const userDaysKey = `lms_user_${currentUser.uid}_days`;
      const userSessionsKey = `lms_user_${currentUser.uid}_sessions`;
      const userWeightKey = `lms_user_${currentUser.uid}_weights`;

      try {
        const cachedDays = localStorage.getItem(userDaysKey);
        const cachedSessions = localStorage.getItem(userSessionsKey);
        const cachedWeights = localStorage.getItem(userWeightKey);

        if (cachedDays) {
          const parsed = JSON.parse(cachedDays);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setDays(parsed);
            setDataLoading(false);
          }
        }
        if (cachedSessions) {
          const parsed = JSON.parse(cachedSessions);
          if (Array.isArray(parsed)) setSessions(parsed);
        }
        if (cachedWeights) {
          const parsed = JSON.parse(cachedWeights);
          if (Array.isArray(parsed)) setWeightEntries(parsed);
        }
      } catch (e) {
        console.warn('Cache recovery error:', e);
      }

      // 2. Direct fetch as immediate fallback
      fetchWorkoutDaysOnce(currentUser.uid).then(async (fetched) => {
        if (fetched.length > 0) {
          setDays(fetched);
          localStorage.setItem(userDaysKey, JSON.stringify(fetched));
          setDataLoading(false);
        } else {
          // If Cloud has 0 days, check if user had local guest days to auto-sync
          try {
            const guestDays = localStorage.getItem(LOCAL_STORAGE_DAYS_KEY);
            if (guestDays) {
              const parsedGuest: WorkoutDay[] = JSON.parse(guestDays);
              if (parsedGuest.length > 0) {
                for (const gDay of parsedGuest) {
                  await saveWorkoutDay(currentUser.uid, gDay);
                }
                setDays(parsedGuest);
                localStorage.setItem(userDaysKey, guestDays);
              }
            }
          } catch (syncErr) {
            console.warn('Guest data migration notice:', syncErr);
          }
          setDataLoading(false);
        }
      });

      fetchWorkoutSessionsOnce(currentUser.uid).then((fetched) => {
        if (fetched.length > 0) {
          setSessions(fetched);
          localStorage.setItem(userSessionsKey, JSON.stringify(fetched));
        }
      });

      fetchWeightEntriesOnce(currentUser.uid).then((fetched) => {
        if (fetched.length > 0) {
          setWeightEntries(fetched);
          localStorage.setItem(userWeightKey, JSON.stringify(fetched));
        }
      });

      // 3. Real-time Firestore Subscriptions
      const unsubDays = subscribeWorkoutDays(
        currentUser.uid,
        (fetchedDays) => {
          setDays(fetchedDays);
          localStorage.setItem(userDaysKey, JSON.stringify(fetchedDays));
          setDataLoading(false);
        },
        (err) => {
          console.warn('Days subscription notice:', err);
          setDataLoading(false);
        }
      );

      const unsubSessions = subscribeWorkoutSessions(
        currentUser.uid,
        (fetchedSessions) => {
          setSessions(fetchedSessions);
          localStorage.setItem(userSessionsKey, JSON.stringify(fetchedSessions));
        },
        (err) => console.warn('Sessions subscription notice:', err)
      );

      const unsubWeight = subscribeWeightEntries(
        currentUser.uid,
        (fetchedWeights) => {
          setWeightEntries(fetchedWeights);
          localStorage.setItem(userWeightKey, JSON.stringify(fetchedWeights));
        },
        (err) => console.warn('Weight subscription notice:', err)
      );

      return () => {
        if (unsubDays) unsubDays();
        if (unsubSessions) unsubSessions();
        if (unsubWeight) unsubWeight();
      };
    } else {
      // Local fallback for guest / offline mode
      try {
        const savedDays = localStorage.getItem(LOCAL_STORAGE_DAYS_KEY);
        const savedSessions = localStorage.getItem(LOCAL_STORAGE_SESSIONS_KEY);
        const savedWeights = localStorage.getItem(LOCAL_STORAGE_WEIGHT_KEY);

        if (savedDays) setDays(JSON.parse(savedDays));
        if (savedSessions) setSessions(JSON.parse(savedSessions));
        if (savedWeights) setWeightEntries(JSON.parse(savedWeights));
      } catch (e) {
        console.error('Local storage read error:', e);
      }
      setDataLoading(false);
    }
  }, [currentUser, authLoading]);

  // Persist cache locally for offline/instant resume
  useEffect(() => {
    if (authLoading) return;
    const daysKey = currentUser ? `lms_user_${currentUser.uid}_days` : LOCAL_STORAGE_DAYS_KEY;
    const sessionsKey = currentUser ? `lms_user_${currentUser.uid}_sessions` : LOCAL_STORAGE_SESSIONS_KEY;
    const weightKey = currentUser ? `lms_user_${currentUser.uid}_weights` : LOCAL_STORAGE_WEIGHT_KEY;

    try {
      if (days.length > 0) localStorage.setItem(daysKey, JSON.stringify(days));
      if (sessions.length > 0) localStorage.setItem(sessionsKey, JSON.stringify(sessions));
      if (weightEntries.length > 0) localStorage.setItem(weightKey, JSON.stringify(weightEntries));
    } catch (e) {
      // ignore
    }
  }, [currentUser, authLoading, days, sessions, weightEntries]);

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
    setDays((prev) => prev.filter((d) => d.id !== dayId));
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
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
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
    setWeightEntries((prev) => prev.filter((w) => w.id !== entryId));
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
