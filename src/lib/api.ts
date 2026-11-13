/**
 * Calls to the dashboard's own Express backend (NEXT_PUBLIC_URL).
 *
 * Always sends the session cookie (`credentials: "include"`). Several routes
 * did not, which would break them as soon as the backend starts requiring auth
 * on them (BACKLOG item 3). Client backends (Palmas, Monge, Reforma, Scan-eat,
 * CRM) have their own base URLs and do not go through here.
 */
export const API_URL = process.env.NEXT_PUBLIC_URL ?? "";

export function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  return fetch(`${API_URL}${path}`, { credentials: "include", ...init });
}
