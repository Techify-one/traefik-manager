export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
}

async function parseJson<T>(response: Response): Promise<ApiResponse<T>> {
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return (await response.json()) as ApiResponse<T>;
  }
  const text = await response.text();
  throw new Error(text || 'Unexpected response');
}

export async function apiGet<T>(url: string, init: RequestInit = {}): Promise<ApiResponse<T>> {
  const response = await fetch(url, {
    ...init,
    method: 'GET',
    credentials: 'include'
  });
  if (!response.ok) {
    const payload = await parseJson<T>(response).catch(() => ({ success: false, message: response.statusText, data: undefined as unknown as T }));
    throw new Error(payload.message || `Request failed with status ${response.status}`);
  }
  return parseJson<T>(response);
}

export async function apiPost<T>(url: string, body: unknown, init: RequestInit = {}): Promise<ApiResponse<T>> {
  const response = await fetch(url, {
    ...init,
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(init.headers || {})
    },
    body: JSON.stringify(body)
  });
  const payload = await parseJson<T>(response);
  if (!response.ok || !payload.success) {
    throw new Error(payload.message || 'Request failed');
  }
  return payload;
}

export async function apiDelete<T>(url: string, body?: unknown, init: RequestInit = {}): Promise<ApiResponse<T>> {
  const response = await fetch(url, {
    ...init,
    method: 'DELETE',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(init.headers || {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const payload = await parseJson<T>(response);
  if (!response.ok || !payload.success) {
    throw new Error(payload.message || 'Request failed');
  }
  return payload;
}
