const AUTH_KEY = "luxen.admin.auth";
const AGENCY_KEY = "luxen.admin.agency";

export type AuthSession = {
  username: string;
  basicToken: string;
};

export function saveAuth(username: string, password: string) {
  const basicToken = typeof window !== "undefined" ? btoa(`${username}:${password}`) : "";
  const session: AuthSession = { username, basicToken };
  localStorage.setItem(AUTH_KEY, JSON.stringify(session));
  return session;
}

export function getAuth(): AuthSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? (JSON.parse(raw) as AuthSession) : null;
  } catch {
    return null;
  }
}

export function clearAuth() {
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(AGENCY_KEY);
}

export function saveAgencyId(id: string) {
  localStorage.setItem(AGENCY_KEY, id);
}

export function getAgencyId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AGENCY_KEY);
}
