import * as React from 'react';
import { ToastAction, Toast, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from '../components/ui/toast';

export type ToastVariant = 'default' | 'destructive';

type ToasterToast = {
  id: string;
  title?: string;
  description?: string;
  duration?: number;
  variant?: ToastVariant;
};

interface ToastContextValue {
  toasts: ToasterToast[];
  toast: (toast: Omit<ToasterToast, 'id'>) => void;
  dismiss: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextValue | undefined>(undefined);

export const ToastProviderInternal: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [toasts, setToasts] = React.useState<ToasterToast[]>([]);

  const toast = React.useCallback((toast: Omit<ToasterToast, 'id'>) => {
    const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2);
    setToasts((current) => [...current, { id, duration: 4000, variant: 'default', ...toast }]);
  }, []);

  const dismiss = React.useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      <ToastProvider>{children}</ToastProvider>
    </ToastContext.Provider>
  );
};

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProviderInternal');
  }
  return context;
}

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <ToastViewport>
      {toasts.map((toast) => (
        <Toast key={toast.id} onOpenChange={(open) => !open && dismiss(toast.id)} duration={toast.duration} variant={toast.variant}>
          {toast.title ? <ToastTitle>{toast.title}</ToastTitle> : null}
          {toast.description ? <ToastDescription>{toast.description}</ToastDescription> : null}
          <ToastAction altText="Close" onClick={() => dismiss(toast.id)}>
            Close
          </ToastAction>
        </Toast>
      ))}
    </ToastViewport>
  );
}
