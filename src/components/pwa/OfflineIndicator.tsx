import React, { useState, useEffect } from 'react';
import { WifiOff, CloudCheck } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      const timer = setTimeout(() => setShowReconnected(false), 3000);
      return () => clearTimeout(timer);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (showReconnected) {
    return (
      <div className="fixed top-16 left-1/2 -translate-x-1/2 z-40 flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-emerald-600 text-white text-xs font-semibold shadow-lg animate-in fade-in slide-in-from-top-2 duration-300">
        <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
        <span>Connessione ripristinata</span>
      </div>
    );
  }

  if (isOnline) return null;

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-40 flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-zinc-900/90 dark:bg-zinc-100/90 text-white dark:text-zinc-900 text-xs font-semibold shadow-lg backdrop-blur-md border border-amber-500/30 animate-in fade-in slide-in-from-top-2 duration-300">
      <WifiOff className="w-3.5 h-3.5 text-amber-500" />
      <span>Modalità Offline — I dati locali sono attivi</span>
    </div>
  );
};
