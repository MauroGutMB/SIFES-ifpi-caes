// Access token vive só em memória (nunca em localStorage) — o refresh token é um cookie
// httpOnly setado pelo backend, inacessível ao JS. Isso é intencional: se o access token
// vazar via XSS ele expira em minutos; o refresh token não fica exposto de jeito nenhum.
let accessToken: string | null = null;

type SessionExpiredListener = () => void;
const sessionExpiredListeners = new Set<SessionExpiredListener>();

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function onSessionExpired(listener: SessionExpiredListener): () => void {
  sessionExpiredListeners.add(listener);
  return () => sessionExpiredListeners.delete(listener);
}

export function notifySessionExpired(): void {
  accessToken = null;
  for (const listener of sessionExpiredListeners) listener();
}
