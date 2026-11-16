import { api, clearCsrf } from "./http";
import type { Role } from "./auth";

export type UserProfile = { fullName: string | null; email: string; username: string; role: Role; createdAt: string };

export const getMyProfile = () => api<UserProfile>("/api/v1/users/me");
export const updateMyProfile = (fullName: string) => api<UserProfile>("/api/v1/users/me", { method: "PATCH", body: { fullName } });

/** Backend invalidates the current session on success, so the caller must treat the user as signed out. */
export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await api("/api/v1/users/me/change-password", { method: "POST", body: { currentPassword, newPassword } });
  clearCsrf();
}
