import { React, html } from '../lib/html.js';

const ToastContext = React.createContext({
  pushToast: () => {},
  removeToast: () => {},
});

export function ToastProvider({ children }) {
  const [toasts, setToasts] = React.useState([]);

  const removeToast = React.useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const pushToast = React.useCallback((toast) => {
    const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `toast-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const payload = { id, duration: 4000, variant: 'default', ...toast };
    setToasts((current) => [...current, payload]);
    setTimeout(() => removeToast(id), payload.duration);
  }, [removeToast]);

  const value = React.useMemo(() => ({ pushToast, removeToast, toasts }), [pushToast, removeToast, toasts]);

  return html`<${ToastContext.Provider} value=${value}>${children}</${ToastContext.Provider}>`;
}

export function useToast() {
  return React.useContext(ToastContext);
}
