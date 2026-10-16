/**
 * API Configuration Module
 *
 * Routes the API Base URL from environment variables (.env).
 * In Expo React Native, environment variables prefixed with `EXPO_PUBLIC_`
 * are automatically loaded from `.env` without any extra build-step needed.
 *
 * It also supports runtime override for easy mobile testing (e.g., switching
 * between localhost, Android emulator 10.0.2.2, and local LAN IP).
 */

// Default to .env variable, fallback to localhost:8000
const DEFAULT_API_BASE =
  process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8000';

let runtimeApiBase = DEFAULT_API_BASE;

/**
 * Returns the currently active API Base URL.
 */
export function getApiBaseUrl() {
  return runtimeApiBase;
}

/**
 * Returns the WebSocket Base URL derived from API Base URL or .env.
 */
export function getWsBaseUrl() {
  if (process.env.EXPO_PUBLIC_WS_BASE_URL) {
    return process.env.EXPO_PUBLIC_WS_BASE_URL;
  }
  // Automatically convert http:// to ws:// and https:// to wss://
  return runtimeApiBase.replace(/^http/, 'ws');
}

/**
 * Allows switching the API base URL dynamically at runtime
 * (useful for testing on physical devices using local LAN IP).
 */
export function setRuntimeApiBaseUrl(newUrl) {
  if (newUrl && typeof newUrl === 'string') {
    runtimeApiBase = newUrl.replace(/\/+$/, ''); // trim trailing slashes
  }
}

/**
 * Checks the FastAPI backend health endpoint (/api/v1/health).
 */
export async function checkHealth(customUrl = null) {
  const base = customUrl || getApiBaseUrl();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(`${base}/api/v1/health`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      return { ok: true, status: data.status || 'ok' };
    }
    return { ok: false, error: `HTTP ${res.status}` };
  } catch (err) {
    return { ok: false, error: err.message || 'Cannot reach server' };
  }
}
