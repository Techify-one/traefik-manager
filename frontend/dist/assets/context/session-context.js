import { React, html } from '../lib/html.js';
import { useToast } from '../hooks/toast.js';
import { apiGet, apiRequest } from '../lib/api.js';

const SessionContext = React.createContext({
  info: null,
  loading: true,
  refresh: async () => {},
  login: async () => ({ success: false }),
  logout: async () => {},
});

export function SessionProvider({ children }) {
  const { pushToast } = useToast();
  const [info, setInfo] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiGet('/api/session.php');
      setInfo(data.data);
    } catch (error) {
      console.error(error);
      pushToast({
        title: 'Falha ao carregar sessão',
        description: error instanceof Error ? error.message : 'Tente novamente',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [pushToast]);

  React.useEffect(() => {
    load();
  }, [load]);

  const login = React.useCallback(async (username, password) => {
    try {
      const result = await apiRequest('/api/session.php', 'POST', { username, password });
      setInfo(result.data);
      pushToast({ title: 'Autenticado', description: `Bem-vindo, ${result.data.username}!` });
      return { success: true };
    } catch (error) {
      pushToast({
        title: 'Não foi possível entrar',
        description: error instanceof Error ? error.message : 'Verifique suas credenciais.',
        variant: 'destructive',
      });
      return { success: false };
    }
  }, [pushToast]);

  const logout = React.useCallback(async () => {
    try {
      await apiRequest('/api/session.php', 'DELETE');
      setInfo((current) => (current ? { ...current, authenticated: false, username: null, bearerToken: null } : current));
    } catch (error) {
      pushToast({
        title: 'Falha ao sair',
        description: error instanceof Error ? error.message : 'Tente novamente.',
        variant: 'destructive',
      });
    }
  }, [pushToast]);

  const value = React.useMemo(() => ({ info, loading, refresh: load, login, logout }), [info, loading, load, login, logout]);

  return html`<${SessionContext.Provider} value=${value}>${children}</${SessionContext.Provider}>`;
}

export function useSession() {
  return React.useContext(SessionContext);
}
