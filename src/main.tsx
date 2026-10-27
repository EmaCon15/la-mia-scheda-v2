import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register PWA service worker with auto-update
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.info('PWA: Nuova versione disponibile.');
  },
  onOfflineReady() {
    console.info('PWA: Applicazione pronta per l\'utilizzo offline.');
  },
});

createRoot(document.getElementById('root')!).render(<App />);
