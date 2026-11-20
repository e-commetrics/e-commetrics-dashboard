/**
 * Calls to the dashboard's own Express backend (NEXT_PUBLIC_URL).
 *
 * Always sends the session cookie (`credentials: "include"`). Several routes
 * did not, which would break them as soon as the backend starts requiring auth
 * on them (BACKLOG item 3). Client backends (Palmas, Monge, Reforma,
 * CRM) have their own base URLs and do not go through here.
 */
export const API_URL = process.env.NEXT_PUBLIC_URL ?? "";

/** Se emite en `window` cuando el backend responde 401: la sesión venció o no existe. AuthContext lo escucha. */
export const SESSION_EXPIRED_EVENT = "ec:session-expired";

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const res = await fetch(`${API_URL}${path}`, { credentials: "include", ...init });
  if (res.status === 401 && typeof window !== "undefined") window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
  return res;
}
