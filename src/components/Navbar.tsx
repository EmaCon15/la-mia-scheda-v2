import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Dumbbell, Sun, Moon, LogIn, LogOut, Cloud, CloudOff } from 'lucide-react';
import { PWAInstallButton } from './pwa/PWAInstallButton';

export const Navbar: React.FC = () => {
  const { currentUser, signInWithGoogle, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 transition-colors pt-safe">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/10">
            <Dumbbell className="w-5 h-5 -rotate-45" />
          </div>
          <div>
            <h1 className="font-bold text-base leading-none text-zinc-900 dark:text-zinc-100 tracking-tight">
              La mia scheda
            </h1>
            <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 tracking-wider uppercase">
              Calisthenics Tracker
            </span>
          </div>
        </div>

        {/* Right side actions */}
        <div className="flex items-center space-x-2">
          {/* In-App PWA Install Action */}
          <PWAInstallButton variant="navbar" />

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Passa al tema chiaro' : 'Passa al tema scuro'}
            className="p-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-zinc-600" />}
          </button>

          {/* User state */}
          {currentUser ? (
            <div className="flex items-center space-x-2 pl-1 border-l border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center space-x-1.5" title={`Accesso come ${currentUser.displayName || currentUser.email}`}>
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'Utente'}
                    className="w-7 h-7 rounded-full border border-emerald-500/50"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center justify-center">
                    {(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 hidden sm:inline max-w-[120px] truncate">
                  {currentUser.displayName?.split(' ')[0] || 'Atleta'}
                </span>
                <span title="Sincronizzato sul cloud" className="hidden sm:inline-block">
                  <Cloud className="w-3.5 h-3.5 text-emerald-500" />
                </span>
              </div>
              <button
                onClick={logout}
                aria-label="Disconnetti"
                title="Disconnetti"
                className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={signInWithGoogle}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-semibold shadow-sm transition cursor-pointer"
              aria-label="Accedi con Google"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Accedi</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
