/**
 * Application configuration
 * BASE_PATH is now auto-detected at runtime (no config or rebuild needed!)
 */

declare global {
  interface Window {
    __APP_CONFIG__?: {
      appName?: string;
      version?: string;
      basePath?: string;
    };
  }
}

/**
 * Auto-detect BASE_PATH based on current URL
 * - Direct access (http://10.8.200.253:64780/traefik-manager/) -> '/traefik-manager/'
 * - Behind proxy (https://proxy.teste.techify.run/) -> '/' (Traefik rewrites internally)
 */
function detectBasePath(): string {
  const path = window.location.pathname;

  // Check if we're accessing through /traefik-manager/ path
  if (path.startsWith('/traefik-manager/') || path === '/traefik-manager') {
    return '/traefik-manager/';
  }

  // Otherwise assume root (behind proxy with path rewriting)
  return '/';
}

// Base path for the application (auto-detected)
export const BASE_PATH = detectBasePath();

// API base URL (relative to BASE_PATH)
export const API_BASE_URL = `${BASE_PATH}api`;
