import { apiFetch } from "@/lib/api";

export type ClientPage = {
  id: string;
  title: string;
  projectName: string;
  content: string | null;
  percentage: number | null;
  deliverableCount: number;
  createdAt: string | null;
};

export type ClientLinkProject = {
  id: string;
  name: string;
  clientProjectName: string | null;
};

export type ClientAccount = {
  id: string;
  name: string;
  email: string;
  jobTitle: string | null;
  avatarUrl: string | null;
  pages: ClientPage[];
  apps: { component: string; canView: boolean }[];
  projects: ClientLinkProject[];
};

type ClientsResponse = { clients: ClientAccount[] };
type ClientResponse = { client: ClientAccount };
type PageResponse = { page: ClientPage };

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await apiFetch(`/api/clients${path}`, {
    ...init,
    headers: init?.body ? { "Content-Type": "application/json", ...(init?.headers ?? {}) } : init?.headers,
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: string; message?: string } | null;
    throw new Error(data?.error ?? data?.message ?? `${res.status} ${res.statusText || "error"}`);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export function listClients(): Promise<ClientAccount[]> {
  return request<ClientsResponse>("").then((data) => data.clients);
}

export function createClient(input: {
  email: string;
  userName: string;
  password: string;
  jobTitle?: string | null;
  page?: { title: string; projectName?: string; content?: string | null } | null;
}): Promise<ClientAccount> {
  return request<ClientResponse>("", { method: "POST", body: JSON.stringify(input) }).then((data) => data.client);
}

export function updateClient(
  id: string,
  patch: { email?: string; userName?: string; jobTitle?: string | null; password?: string }
): Promise<ClientAccount> {
  return request<ClientResponse>(`/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(patch),
  }).then((data) => data.client);
}

export function deleteClient(id: string): Promise<void> {
  return request<void>(`/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export function createClientPage(
  clientId: string,
  input: { title: string; projectName?: string; content?: string | null }
): Promise<ClientPage> {
  return request<PageResponse>(`/${encodeURIComponent(clientId)}/pages`, {
    method: "POST",
    body: JSON.stringify(input),
  }).then((data) => data.page);
}

export function updateClientPage(
  clientId: string,
  pageId: string,
  patch: { title?: string; projectName?: string; content?: string | null }
): Promise<ClientPage> {
  return request<PageResponse>(`/${encodeURIComponent(clientId)}/pages/${encodeURIComponent(pageId)}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  }).then((data) => data.page);
}

export function deleteClientPage(clientId: string, pageId: string): Promise<void> {
  return request<void>(`/${encodeURIComponent(clientId)}/pages/${encodeURIComponent(pageId)}`, {
    method: "DELETE",
  });
}

export function clientForPage(clients: ClientAccount[], projectName: string | null | undefined): ClientAccount | undefined {
  if (!projectName) return undefined;
  return clients.find((client) => client.pages.some((page) => page.projectName === projectName));
}

export function grantedAppSlugs(client: ClientAccount): string[] {
  return client.apps.filter((app) => app.canView).map((app) => app.component);
}

export function clientInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}
