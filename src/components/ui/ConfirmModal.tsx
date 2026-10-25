import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDestructive?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Elimina',
  cancelLabel = 'Annulla',
  onConfirm,
  onCancel,
  isDestructive = true,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-sm border border-zinc-200 dark:border-zinc-800 shadow-2xl p-5 space-y-4">
        <div className="flex items-start space-x-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              isDestructive
                ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                : 'bg-amber-500/10 text-amber-600'
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
              {title}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 text-xs font-bold rounded-xl text-white shadow-sm transition active:scale-95 cursor-pointer ${
              isDestructive
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
