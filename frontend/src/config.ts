/**
 * Application configuration
 * BASE_PATH is intelligently detected to work in both scenarios:
 * - Direct access: uses PHP config value
 * - Behind proxy: auto-detects based on URL
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
 * Smart BASE_PATH detection
 *
 * Strategy:
 * 1. If URL contains the configured base path -> use it (direct access)
 * 2. Otherwise use '/' (behind proxy with path rewriting)
 *
 * Example:
 * - Direct: http://10.8.200.253:64780/traefik-manager/ -> uses '/traefik-manager/' from PHP
 * - Proxy:  https://proxy.teste.techify.run/ -> uses '/' (Traefik rewrites to /traefik-manager/ internally)
 */
function detectBasePath(): string {
  const configuredBasePath = window.__APP_CONFIG__?.basePath || '/';
  const currentPath = window.location.pathname;

  // If the current URL contains the configured base path, we're accessing directly
  if (configuredBasePath !== '/' &&
      (currentPath.startsWith(configuredBasePath) ||
       currentPath === configuredBasePath.replace(/\/$/, ''))) {
    return configuredBasePath;
  }

  // Otherwise we're behind a proxy that rewrites the path
  return '/';
}

// Base path for the application (intelligently detected)
export const BASE_PATH = detectBasePath();

// API base URL (relative to BASE_PATH)
export const API_BASE_URL = `${BASE_PATH}api`;
