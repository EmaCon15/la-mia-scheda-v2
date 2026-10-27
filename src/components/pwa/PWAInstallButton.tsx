import React, { useState } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { Download, Smartphone, Share, PlusSquare, X, CheckCircle2 } from 'lucide-react';

interface PWAInstallButtonProps {
  variant?: 'navbar' | 'card' | 'compact';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'card' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);

  // If already installed and running standalone, hide or show subtle badge in settings
  if (isInstalled) {
    if (variant === 'card') {
      return (
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs">
          <div className="flex items-center space-x-2 text-emerald-700 dark:text-emerald-300 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>App installata e attiva su dispositivo</span>
          </div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-md">
            Standalone
          </span>
        </div>
      );
    }
    return null;
  }

  // Navbar compact button
  if (variant === 'navbar') {
    if (!isInstallable && !isIOS) return null;

    return (
      <>
        <button
          onClick={isIOS ? () => setShowIOSModal(true) : install}
          aria-label="Installa app sul dispositivo"
          title="Installa l'applicazione sul tuo smartphone o PC"
          className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-all cursor-pointer active:scale-95"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Installa App</span>
        </button>

        {showIOSModal && <IOSInstallModal onClose={() => setShowIOSModal(false)} />}
      </>
    );
  }

  // Card variant for Settings or prominent areas
  return (
    <>
      <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-zinc-50 to-amber-500/10 dark:from-emerald-950/20 dark:via-zinc-900/60 dark:to-amber-950/20 border border-emerald-500/20 dark:border-emerald-500/30 shadow-xs space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-emerald-500 flex items-center justify-center text-white shadow-sm shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center space-x-1.5">
                <span>Installa "La mia scheda"</span>
                <span className="text-[10px] font-semibold px-1.5 py-0.2 bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 rounded">PWA</span>
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Aggiungi l'app alla schermata Home per un avvio rapido a schermo intero e utilizzo offline.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-1">
          {isInstallable ? (
            <button
              onClick={install}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs font-bold flex items-center justify-center space-x-2 shadow-xs transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Installa sulla schermata Home</span>
            </button>
          ) : isIOS ? (
            <button
              onClick={() => setShowIOSModal(true)}
              className="w-full py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white text-xs font-bold flex items-center justify-center space-x-2 shadow-xs transition cursor-pointer"
            >
              <Share className="w-4 h-4" />
              <span>Come installare su iPhone / iPad</span>
            </button>
          ) : (
            <div className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center justify-between p-2.5 bg-zinc-100 dark:bg-zinc-800/60 rounded-xl">
              <span>Installa tramite il menu del browser (icona del download o "Aggiungi a Home")</span>
            </div>
          )}
        </div>
      </div>

      {showIOSModal && <IOSInstallModal onClose={() => setShowIOSModal(false)} />}
    </>
  );
};

const IOSInstallModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-sm border border-zinc-200 dark:border-zinc-800 shadow-2xl p-5 space-y-4">
        <div className="flex items-center justify-between pb-1 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Smartphone className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
              Installa su iPhone & iPad
            </h4>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 text-xs text-zinc-600 dark:text-zinc-300">
          <div className="flex items-start space-x-3 p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50">
            <div className="w-6 h-6 rounded-md bg-blue-500/15 text-blue-600 flex items-center justify-center shrink-0 font-bold text-xs">
              1
            </div>
            <div>
              Tocca il pulsante <span className="font-bold inline-flex items-center gap-1 text-zinc-900 dark:text-zinc-100"><Share className="w-3 h-3 text-blue-500" /> Condividi</span> nella barra inferiore di Safari.
            </div>
          </div>

          <div className="flex items-start space-x-3 p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50">
            <div className="w-6 h-6 rounded-md bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0 font-bold text-xs">
              2
            </div>
            <div>
              Scorri l'elenco verso il basso e tocca <span className="font-bold inline-flex items-center gap-1 text-zinc-900 dark:text-zinc-100"><PlusSquare className="w-3 h-3 text-emerald-500" /> Aggiungi alla schermata Home</span>.
            </div>
          </div>

          <div className="flex items-start space-x-3 p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50">
            <div className="w-6 h-6 rounded-md bg-amber-500/15 text-amber-600 flex items-center justify-center shrink-0 font-bold text-xs">
              3
            </div>
            <div>
              Premi <span className="font-bold text-zinc-900 dark:text-zinc-100">"Aggiungi"</span> in alto a destra. L'icona di "La mia scheda" apparirà sulla tua Home!
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-bold text-xs transition cursor-pointer"
        >
          Ho capito
        </button>
      </div>
    </div>
  );
};
