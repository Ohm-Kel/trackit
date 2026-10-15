import { createContext, useContext, useState, useCallback } from 'react';
import { X, AlertTriangle, CheckCircle2, Info, Bell } from 'lucide-react';

const ToastContext = createContext(null);

const ICONS = {
  success: CheckCircle2,
  warning: AlertTriangle,
  error: AlertTriangle,
  info: Info,
  reminder: Bell,
};

const STYLES = {
  success: 'bg-[#F0FDF4] border-[#BBF7D0] text-[#166534]',
  warning: 'bg-[#FFFBEB] border-[#FDE68A] text-[#92400E]',
  error: 'bg-[#FEF2F2] border-[#FCA5A5] text-[#991B1B]',
  info: 'bg-primary-faint border-primary-mid text-primary',
  reminder: 'bg-[#FFFBEB] border-[#FDE68A] text-[#92400E]',
};

const ICON_COLORS = {
  success: 'text-[#15803D]',
  warning: 'text-[#B45309]',
  error: 'text-[#B91C1C]',
  info: 'text-primary',
  reminder: 'text-[#B45309]',
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, { type = 'info', duration = 5000, title } = {}) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type, title }]);
    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}

      {/* Toast container */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-[380px] w-full pointer-events-none">
        {toasts.map(toast => {
          const Icon = ICONS[toast.type] || Info;
          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-2.5 p-3 px-3.5 border rounded-r shadow-md animate-[slideIn_0.25s_ease] ${STYLES[toast.type] || STYLES.info}`}
            >
              <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${ICON_COLORS[toast.type] || ICON_COLORS.info}`} />
              <div className="flex-1 min-w-0">
                {toast.title && <div className="text-[12px] font-bold mb-0.5">{toast.title}</div>}
                <div className="text-[12.5px] leading-relaxed">{toast.message}</div>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="p-0.5 bg-transparent border-none cursor-pointer opacity-60 hover:opacity-100 transition-opacity shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}
