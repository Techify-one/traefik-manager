export interface SessionInfo {
  authenticated: boolean;
  username: string | null;
  appName: string;
  version: string;
  bearerToken: string | null;
  apiBaseUrl: string | null;
  csrfToken: string | null;
}

export interface SessionResponse {
  success: boolean;
  message?: string;
  data: SessionInfo;
}
