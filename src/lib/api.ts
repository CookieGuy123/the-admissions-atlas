/**
 * API base URL utility for Capacitor Android compatibility.
 *
 * When running inside a Capacitor Android APK, the page origin is
 * `capacitor://localhost` (or `http://localhost`), not the Vercel domain,
 * so relative `/api/...` fetches will fail.
 *
 * This helper returns the absolute Vercel API base when running in Capacitor,
 * and an empty string (so relative URLs work) when running on the web.
 */

const VERCEL_BASE = "https://theadmissionsatlas.zaaminkhan.com";

function isCapacitor(): boolean {
  // Capacitor sets window.Capacitor, and the protocol is capacitor: or http://localhost
  return (
    typeof window !== "undefined" &&
    (
      !!(window as any).Capacitor ||
      window.location.protocol === "capacitor:" ||
      (window.location.hostname === "localhost" && window.location.protocol !== "http:")
    )
  );
}

export const API_BASE = isCapacitor() ? VERCEL_BASE : "";

/**
 * Drop-in replacement for fetch() that prepends the API base automatically.
 * Usage: apiFetch("/api/scholarships") → works on both web and Android APK.
 */
export function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${API_BASE}${path}`, init);
}
