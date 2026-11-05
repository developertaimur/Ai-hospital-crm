import type { Role } from "@/lib/types";

/**
 * Whether the current session (and optional admin "view as") may access routes
 * restricted to the given roles. Admin-only routes require a real admin session.
 */
export function canAccessRole(
  sessionRole: Role,
  viewingAs: Role | null,
  allowed: Role[],
): boolean {
  if (allowed.includes("admin")) {
    return sessionRole === "admin";
  }
  if (sessionRole === "admin" && viewingAs && allowed.includes(viewingAs)) {
    return true;
  }
  const effective = viewingAs ?? sessionRole;
  return allowed.includes(effective);
}
