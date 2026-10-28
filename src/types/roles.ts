/**
 * Public product role names used by the redesigned Khabar Koi UI.
 * The legacy internal names remain supported so existing prototype screens
 * and persisted browser data are not broken during the migration.
 */
export type PortalRole = "buyer" | "seller" | "admin";
export type LegacyRole = "customer" | "kitchen" | "admin";
export type KitchenApplicationStatus = "PENDING_REVIEW" | "ACTIVE" | "REJECTED";

export type SellerApplicationRecord = {
  userEmail: string;
  kitchenId: number;
  kitchenName: string;
  description: string;
  status: KitchenApplicationStatus;
  submittedAt: string;
};

export const LEGACY_TO_PORTAL_ROLE: Record<LegacyRole, PortalRole> = {
  customer: "buyer",
  kitchen: "seller",
  admin: "admin",
};

export const PORTAL_ROLE_LABELS: Record<PortalRole, string> = {
  buyer: "Buyer",
  seller: "Seller",
  admin: "Admin",
};

export function toPortalRole(role: LegacyRole): PortalRole {
  return LEGACY_TO_PORTAL_ROLE[role];
}
