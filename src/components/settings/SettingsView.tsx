import React, { useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { WorkoutDay, WorkoutSession, WeightEntry } from '../../types';
import { exportUserData, importUserData } from '../../services/firestoreService';
import { validateImportData } from '../../utils/workoutUtils';
import {
  User,
  LogIn,
  LogOut,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  Download,
  Upload,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Cloud,
} from 'lucide-react';
import { PWAInstallButton } from '../pwa/PWAInstallButton';

interface SettingsViewProps {
  days: WorkoutDay[];
  sessions: WorkoutSession[];
  weightEntries: WeightEntry[];
  onLoadExampleTemplate: () => Promise<void>;
  onRefreshData?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  days,
  sessions,
  weightEntries,
  onLoadExampleTemplate,
  onRefreshData,
}) => {
  const { currentUser, signInWithGoogle, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Handle Export to JSON
  const handleExport = async () => {
    try {
      const payload = await exportUserData(
        currentUser ? currentUser.uid : 'local-user',
        days,
        sessions,
        weightEntries
      );
      const dataStr =
        'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(payload, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute(
        'download',
        `la-mia-scheda-backup-${new Date().toISOString().split('T')[0]}.json`
      );
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err) {
      console.error('Export error:', err);
      alert('Errore durante l\'esportazione dei dati.');
    }
  };

  // Handle Import from JSON
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportStatus(null);
    setImportError(null);
    setIsImporting(true);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const validation = validateImportData(text);

        if (!validation.valid || !validation.data) {
          setImportError(validation.error || 'File di backup non valido.');
          setIsImporting(false);
          return;
        }

        const payload = validation.data;
        if (!currentUser) {
          setImportError('Accedi con Google per importare e sincronizzare i dati su Firestore.');
          setIsImporting(false);
          return;
        }

        const counts = await importUserData(currentUser.uid, payload);
        setImportStatus(
          `Importazione completata con successo! ${counts.daysCount} giornate, ${counts.sessionsCount} sessioni e ${counts.weightCount} pesate sincronizzate.`
        );
        if (onRefreshData) onRefreshData();
      } catch (err: unknown) {
        console.error('Import error:', err);
        const msg = err instanceof Error ? err.message : String(err);
        setImportError(`Errore durante il salvataggio: ${msg}`);
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };

    reader.readAsText(file);
  };

  return (
    <div className="space-y-5 pb-24">
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">
          Impostazioni & Account
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Gestisci il tuo profilo, preferenze di allenamento e backup dei dati
        </p>
      </div>

      {/* PWA Installation Card */}
      <PWAInstallButton variant="card" />

      {/* Account Section */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-3">
        <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center space-x-2">
          <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <User className="w-3.5 h-3.5" />
          </div>
          <span>Account & Cloud Sync</span>
        </h3>

        {currentUser ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 gap-3">
            <div className="flex items-center space-x-3">
              {currentUser.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.displayName || 'Utente'}
                  className="w-11 h-11 rounded-full border border-emerald-500/40"
                />
              ) : (
                <div className="w-11 h-11 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-extrabold text-base flex items-center justify-center">
                  {(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}
                </div>
              )}
              <div>
                <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100 block">
                  {currentUser.displayName || 'Atleta'}
                </span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400 block">
                  {currentUser.email}
                </span>
                <span className="inline-flex items-center space-x-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                  <Cloud className="w-3 h-3" />
                  <span>Sincronizzazione account attiva</span>
                </span>
              </div>
            </div>

            <button
              onClick={logout}
              className="px-3.5 py-2 rounded-xl bg-zinc-200 dark:bg-zinc-700 hover:bg-red-500 hover:text-white dark:hover:bg-red-600 text-zinc-800 dark:text-zinc-200 text-xs font-semibold flex items-center justify-center space-x-1.5 transition cursor-pointer self-start sm:self-auto"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Disconnetti</span>
            </button>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 space-y-3">
            <div className="space-y-1">
              <h4 className="font-bold text-xs text-zinc-900 dark:text-zinc-100">
                Accedi per salvare i tuoi allenamenti sul Cloud
              </h4>
              <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
                Collegati con il tuo account Google per non perdere mai le tue schede e sincronizzare i dati su tutti i tuoi dispositivi smartphone e PC.
              </p>
            </div>
            <button
              onClick={signInWithGoogle}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center space-x-2 shadow-sm transition cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Accedi con Google</span>
            </button>
          </div>
        )}
      </div>

      {/* App Preferences */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-3">
        <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
          Preferenze Applicazione
        </h3>

        {/* Theme toggle */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40">
          <div className="flex items-center space-x-2.5">
            {theme === 'dark' ? (
              <Moon className="w-4 h-4 text-emerald-500" />
            ) : (
              <Sun className="w-4 h-4 text-amber-500" />
            )}
            <div>
              <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100 block">
                Tema Interfaccia
              </span>
              <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                {theme === 'dark' ? 'Tema Scuro (ottimizzato per la palestra)' : 'Tema Chiaro'}
              </span>
            </div>
          </div>
          <button
            onClick={toggleTheme}
            className="px-3 py-1.5 rounded-lg bg-zinc-200 dark:bg-zinc-700 text-xs font-semibold text-zinc-800 dark:text-zinc-200 cursor-pointer"
          >
            {theme === 'dark' ? 'Passa a Chiaro' : 'Passa a Scuro'}
          </button>
        </div>


      </div>

      {/* Backup and JSON Data Management */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-3">
        <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
          Backup & Gestione Dati (JSON)
        </h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Esporta o importa tutti i tuoi dati in formato JSON standard senza vincoli di piattaforma.
        </p>

        {importStatus && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{importStatus}</span>
          </div>
        )}

        {importError && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{importError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          {/* Export JSON */}
          <button
            onClick={handleExport}
            className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 hover:border-emerald-500 text-left transition flex items-center space-x-3 cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100 block">
                Esporta Dati JSON
              </span>
              <span className="text-[10px] text-zinc-500">
                Scarica copia di schede, registro e peso
              </span>
            </div>
          </button>

          {/* Import JSON */}
          <div>
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              className="w-full p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 hover:border-emerald-500 text-left transition flex items-center space-x-3 disabled:opacity-50 cursor-pointer"
            >
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Upload className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100 block">
                  {isImporting ? 'Importazione in corso...' : 'Importa Backup JSON'}
                </span>
                <span className="text-[10px] text-zinc-500">
                  Carica un file JSON salvato in precedenza
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Load Template */}
        <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <button
            onClick={async () => {
              if (
                window.confirm(
                  'Vuoi aggiungere la scheda d\'esempio Calisthenics (Push & Pull con ABS)?'
                )
              ) {
                await onLoadExampleTemplate();
              }
            }}
            className="w-full py-2.5 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-semibold flex items-center justify-center space-x-1.5 transition cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Aggiungi Scheda Calisthenics Consigliata (Push & Pull)</span>
          </button>
        </div>
      </div>

      {/* Cloudflare Pages Deploy Info */}
      <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-500 dark:text-zinc-400 space-y-1">
        <span className="font-bold text-zinc-700 dark:text-zinc-300 block">
          Deploy Cloudflare Pages
        </span>
        <p>
          Questa app è 100% statica (Vite + React) e si collega direttamente a Cloudflare Pages tramite il comando standard <code className="bg-zinc-200 dark:bg-zinc-800 px-1 py-0.5 rounded text-zinc-800 dark:text-zinc-200">npm run build</code> e cartella di output <code className="bg-zinc-200 dark:bg-zinc-800 px-1 py-0.5 rounded text-zinc-800 dark:text-zinc-200">dist</code>.
        </p>
      </div>
    </div>
  );
};
