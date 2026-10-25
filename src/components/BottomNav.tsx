import React from 'react';
import { LayoutGrid, ClipboardList, Scale, Settings } from 'lucide-react';

export type TabType = 'scheda' | 'registro' | 'peso' | 'impostazioni';

interface BottomNavProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onSelectTab,
}) => {
  const tabs = [
    { id: 'scheda' as TabType, label: 'Scheda', icon: LayoutGrid },
    { id: 'registro' as TabType, label: 'Registro', icon: ClipboardList },
    { id: 'peso' as TabType, label: 'Peso', icon: Scale },
    { id: 'impostazioni' as TabType, label: 'Altro', icon: Settings },
  ];

  return (
    <nav
      aria-label="Navigazione principale"
      className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-lg border-t border-zinc-200 dark:border-zinc-800 pb-safe transition-colors"
    >
      <div className="max-w-md mx-auto grid grid-cols-4 px-2 py-1.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              aria-label={tab.label}
              className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all cursor-pointer ${
                isActive
                  ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              <Icon
                className={`w-5 h-5 transition-transform ${
                  isActive ? 'scale-110' : ''
                }`}
              />
              <span className="text-[11px] mt-1 tracking-tight">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
