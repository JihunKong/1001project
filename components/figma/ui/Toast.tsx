'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastProps {
  toast: ToastMessage;
  onClose: (id: string) => void;
}

const toastConfig = {
  success: {
    icon: CheckCircle,
    bgColor: 'bg-green-50',
    borderColor: 'border-green-500',
    textColor: 'text-green-800',
    iconColor: 'text-green-500'
  },
  error: {
    icon: AlertCircle,
    bgColor: 'bg-red-50',
    borderColor: 'border-red-500',
    textColor: 'text-red-800',
    iconColor: 'text-red-500'
  },
  warning: {
    icon: AlertTriangle,
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-500',
    textColor: 'text-yellow-800',
    iconColor: 'text-yellow-500'
  },
  info: {
    icon: Info,
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-500',
    textColor: 'text-blue-800',
    iconColor: 'text-blue-500'
  }
};

function Toast({ toast, onClose }: ToastProps) {
  const [isExiting, setIsExiting] = useState(false);
  const config = toastConfig[toast.type];
  const Icon = config.icon;

  useEffect(() => {
    const duration = toast.duration || 5000;
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onClose(toast.id), 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onClose]);

  return (
    <div
      role="alert"
      aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
      aria-atomic="true"
      className={cn(
        'flex items-start gap-3 p-4 rounded-lg border-l-4 shadow-lg min-w-[320px] max-w-[480px]',
        'transition-all duration-300 animate-in slide-in-from-right',
        config.bgColor,
        config.borderColor,
        isExiting && 'animate-out slide-out-to-right'
      )}
    >
      <Icon className={cn('w-5 h-5 flex-shrink-0 mt-0.5', config.iconColor)} aria-hidden="true" />

      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-medium', config.textColor)}>
          {toast.message}
        </p>

        {toast.action && (
          <button
            onClick={toast.action.onClick}
            className={cn(
              'mt-2 text-sm font-medium underline hover:no-underline',
              config.textColor
            )}
          >
            {toast.action.label}
          </button>
        )}
      </div>

      <button
        onClick={() => {
          setIsExiting(true);
          setTimeout(() => onClose(toast.id), 300);
        }}
        className={cn(
          'flex-shrink-0 p-1 rounded transition-colors min-h-[24px] min-w-[24px]',
          config.textColor,
          'hover:bg-black/5'
        )}
        aria-label="Dismiss notification"
      >
        <X className="w-4 h-4" aria-hidden="true" />
      </button>
    </div>
  );
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onClose: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

const positionClasses = {
  'top-right': 'top-4 right-4',
  'top-left': 'top-4 left-4',
  'bottom-right': 'bottom-4 right-4',
  'bottom-left': 'bottom-4 left-4',
  'top-center': 'top-4 left-1/2 -translate-x-1/2',
  'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2'
};

export function ToastContainer({ toasts, onClose, position = 'top-right' }: ToastContainerProps) {
  if (typeof document === 'undefined') return null;

  const containerContent = (
    <div
      className={cn(
        'fixed z-50 flex flex-col gap-2',
        positionClasses[position]
      )}
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </div>
  );

  return createPortal(containerContent, document.body);
}

let toastIdCounter = 0;
const toastListeners: Array<(toasts: ToastMessage[]) => void> = [];
let currentToasts: ToastMessage[] = [];

function notifyListeners() {
  toastListeners.forEach(listener => listener([...currentToasts]));
}

export const toast = {
  success: (message: string, options?: Partial<ToastMessage>) => {
    const id = `toast-${++toastIdCounter}`;
    currentToasts.push({ id, type: 'success', message, ...options });
    notifyListeners();
    return id;
  },
  error: (message: string, options?: Partial<ToastMessage>) => {
    const id = `toast-${++toastIdCounter}`;
    currentToasts.push({ id, type: 'error', message, ...options });
    notifyListeners();
    return id;
  },
  warning: (message: string, options?: Partial<ToastMessage>) => {
    const id = `toast-${++toastIdCounter}`;
    currentToasts.push({ id, type: 'warning', message, ...options });
    notifyListeners();
    return id;
  },
  info: (message: string, options?: Partial<ToastMessage>) => {
    const id = `toast-${++toastIdCounter}`;
    currentToasts.push({ id, type: 'info', message, ...options });
    notifyListeners();
    return id;
  },
  dismiss: (id: string) => {
    currentToasts = currentToasts.filter(t => t.id !== id);
    notifyListeners();
  },
  dismissAll: () => {
    currentToasts = [];
    notifyListeners();
  }
};

export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const listener = (updatedToasts: ToastMessage[]) => {
      setToasts(updatedToasts);
    };

    toastListeners.push(listener);

    return () => {
      const index = toastListeners.indexOf(listener);
      if (index > -1) {
        toastListeners.splice(index, 1);
      }
    };
  }, []);

  return {
    toasts,
    toast,
    dismiss: toast.dismiss,
    dismissAll: toast.dismissAll
  };
}
