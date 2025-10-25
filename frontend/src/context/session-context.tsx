import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { SessionInfo, SessionResponse } from '../types/session';
import { API_BASE_URL } from '../config';

interface SessionContextValue {
  loading: boolean;
  info: SessionInfo | null;
  refresh: () => Promise<void>;
  login: (username: string, password: string) => Promise<SessionResponse>;
  logout: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

const bootstrap = (globalThis as { __APP_CONFIG__?: Partial<SessionInfo> }).__APP_CONFIG__ ?? {};

const defaultInfo: SessionInfo = {
  authenticated: false,
  username: null,
  appName: bootstrap.appName ?? 'Traefik Manager',
  version: bootstrap.version ?? '1.0.0',
  bearerToken: null,
  apiBaseUrl: null,
  csrfToken: null
};

async function parseResponse(response: Response): Promise<SessionResponse> {
  const json = (await response.json()) as SessionResponse;
  return json;
}

export const SessionProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [info, setInfo] = useState<SessionInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/session.php`, {
        credentials: 'include',
        headers: {
          Accept: 'application/json'
        }
      });
      if (!response.ok) {
        setInfo(defaultInfo);
        return;
      }
      const json = await parseResponse(response);
      setInfo(json.data);
    } catch (error) {
      console.error('Failed to refresh session', error);
      setInfo(defaultInfo);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const login = useCallback(async (username: string, password: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/session.php`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      const json = await parseResponse(response);

      if (response.ok && json.success) {
        setInfo(json.data);
      }

      return json;
    } catch (error) {
      console.error('Login failed', error);
      setInfo(defaultInfo);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        data: defaultInfo
      } satisfies SessionResponse;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await fetch(`${API_BASE_URL}/session.php`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          Accept: 'application/json'
        }
      });
    } catch (error) {
      console.error('Logout failed', error);
    } finally {
      setInfo(defaultInfo);
      setLoading(false);
    }
  }, []);

  const value = useMemo(
    () => ({
      loading,
      info: info ?? defaultInfo,
      refresh,
      login,
      logout
    }),
    [info, loading, refresh, login, logout]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
};

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within SessionProvider');
  }
  return context;
}
