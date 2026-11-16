import { api, ApiError, clearCsrf } from "./http";

export type Role = "USER" | "ADMIN";
export type Identity = { username: string; role: Role };

// Signup: OTP request -> OTP verify (returns single-use signupToken) -> complete.
export const requestSignupOtp = (email: string) => api("/api/v1/auth/signup/otp/request", { method: "POST", body: { email } });
export const verifySignupOtp = (email: string, otp: string) =>
  api<{ signupToken: string }>("/api/v1/auth/signup/otp/verify", { method: "POST", body: { email, otp } });
export const completeSignup = (signupToken: string, username: string, password: string) =>
  api("/api/v1/auth/signup/complete", { method: "POST", body: { signupToken, username, password } });

export async function login(username: string, password: string): Promise<Identity> {
  const me = await api<Identity>("/api/v1/auth/login", { method: "POST", body: { username, password } });
  clearCsrf(); // session id + CSRF token rotate on login
  return me;
}

export async function logout(): Promise<void> {
  try { await api("/api/v1/auth/logout", { method: "POST" }); } finally { clearCsrf(); }
}

/** null = not signed in (backend answers 401/403 for anonymous sessions). */
export async function currentIdentity(): Promise<Identity | null> {
  try { return await api<Identity>("/api/v1/auth/me"); }
  catch (e) { if (e instanceof ApiError && (e.status === 401 || e.status === 403)) return null; throw e; }
}
