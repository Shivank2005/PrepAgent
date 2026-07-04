const SESSION_KEY = "prepagent_active_session";
const AUTH_TOKEN_KEY = "prepagent_auth_token";
const USER_DATA_KEY = "prepagent_user_data";

export function getActiveSessionId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(SESSION_KEY);
}

export function setActiveSessionId(sessionId: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem(SESSION_KEY, sessionId);
  }
}

export function clearActiveSessionId() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(SESSION_KEY);
  }
}

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setAuthToken(token: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  }
}

export function clearAuthToken() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(USER_DATA_KEY);
    clearActiveSessionId(); // Clear session too on logout
  }
}

export function setUserData(userData: any) {
  if (typeof window !== "undefined") {
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
  }
}

export function getUserData(): any {
  if (typeof window === "undefined") return null;
  const data = localStorage.getItem(USER_DATA_KEY);
  try {
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}
