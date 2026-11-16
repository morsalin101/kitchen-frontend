// Single entry point for every backend call.
// Session-cookie auth + CSRF (HttpSessionCsrfTokenRepository): see architecture §6–§7.
// The token lives in memory only (never localStorage) and is refreshed after login/logout/password change.
export class ApiError extends Error {
  constructor(public status: number, message: string, public retryAfter?: number) {
    super(message);
  }
}

type Csrf = { headerName: string; token: string };
let csrf: Csrf | null = null;
export const clearCsrf = () => { csrf = null; };

async function loadCsrf(): Promise<Csrf> {
  const res = await fetch("/api/v1/auth/csrf", { credentials: "include" });
  if (!res.ok) throw new ApiError(res.status, "Could not start a secure session. Is the backend running?");
  csrf = (await res.json()) as Csrf;
  return csrf;
}

const fallback = (status: number) =>
  status === 401 ? "Please sign in." : status === 403 ? "You are not allowed to do that." : status === 429 ? "Too many attempts. Try again later." : `Request failed (${status}).`;

export async function api<T = void>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const method = (init.method ?? "GET").toUpperCase();
  const unsafe = method !== "GET";
  const run = async (canRetry: boolean): Promise<T> => {
    const headers: Record<string, string> = { Accept: "application/json" };
    if (init.body !== undefined) headers["Content-Type"] = "application/json";
    if (unsafe) { const c = csrf ?? (await loadCsrf()); headers[c.headerName] = c.token; }
    const res = await fetch(path, { method, headers, credentials: "include", body: init.body === undefined ? undefined : JSON.stringify(init.body) });
    if (res.status === 403 && unsafe && canRetry) { clearCsrf(); return run(false); } // stale CSRF/session: refresh once
    if (!res.ok) {
      const text = (await res.text().catch(() => "")).trim().slice(0, 300);
      throw new ApiError(res.status, text || fallback(res.status), Number(res.headers.get("Retry-After")) || undefined);
    }
    if (res.status === 204 || !(res.headers.get("content-type") ?? "").includes("json")) return undefined as T;
    return (await res.json()) as T;
  };
  return run(true);
}

/** Multipart variant for validated image uploads. Keeps the same session-cookie and CSRF behavior. */
export async function apiForm<T = void>(path: string, form: FormData, method = "POST"): Promise<T> {
  const unsafe = method.toUpperCase() !== "GET";
  const run = async (canRetry: boolean): Promise<T> => {
    const headers: Record<string, string> = { Accept: "application/json" };
    if (unsafe) { const c = csrf ?? (await loadCsrf()); headers[c.headerName] = c.token; }
    const res = await fetch(path, { method, headers, credentials: "include", body: form });
    if (res.status === 403 && unsafe && canRetry) { clearCsrf(); return run(false); }
    if (!res.ok) {
      const text = (await res.text().catch(() => "")).trim().slice(0, 300);
      throw new ApiError(res.status, text || fallback(res.status), Number(res.headers.get("Retry-After")) || undefined);
    }
    if (res.status === 204 || !(res.headers.get("content-type") ?? "").includes("json")) return undefined as T;
    return await res.json() as T;
  };
  return run(true);
}
