/**
 * Demo-only authentication helpers.
 * Credentials are read from `.env` (NEXT_PUBLIC_DEMO_*).
 * NOT real security — NEXT_PUBLIC_ values are bundled into the client.
 * Production must use server-side auth, hashed credentials, and session management.
 */

import type { Permission, Role, SessionUser } from "@/lib/types";

export interface DemoAccount {
  username: string;
  password: string;
  userId: string;
  displayName: string;
  role: Role;
  doctorId?: string;
  permissions: Permission[];
}

const ALL_ADMIN_PERMISSIONS: Permission[] = [
  "view_dashboard",
  "manage_appointments",
  "manage_patients",
  "manage_callbacks",
  "view_calls",
  "manage_settings",
  "view_as",
  "manage_staff",
  "verify_payment",
  "update_arrival",
  "view_own_schedule",
  "view_activity",
];

const DOCTOR_PERMISSIONS: Permission[] = [
  "view_dashboard",
  "view_own_schedule",
  "update_arrival",
  "view_activity",
];

const RECEPTION_PERMISSIONS: Permission[] = [
  "view_dashboard",
  "manage_appointments",
  "manage_patients",
  "manage_callbacks",
  "view_calls",
  "verify_payment",
  "view_activity",
];

function envOr(key: string, fallback: string): string {
  const value = process.env[key];
  return value && value.length > 0 ? value : fallback;
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    username: envOr("NEXT_PUBLIC_DEMO_ADMIN_USERNAME", "admin"),
    password: envOr("NEXT_PUBLIC_DEMO_ADMIN_PASSWORD", "admin123"),
    userId: "user-admin",
    displayName: "System Admin",
    role: "admin",
    permissions: ALL_ADMIN_PERMISSIONS,
  },
  {
    username: envOr(
      "NEXT_PUBLIC_DEMO_DOCTOR_AHMED_USERNAME",
      "doctor.ahmed",
    ),
    password: envOr(
      "NEXT_PUBLIC_DEMO_DOCTOR_AHMED_PASSWORD",
      "doctor123",
    ),
    userId: "user-doc-ahmed",
    displayName: "Dr. Ahmed Hassan",
    role: "doctor",
    doctorId: "doc-ahmed",
    permissions: DOCTOR_PERMISSIONS,
  },
  {
    username: envOr(
      "NEXT_PUBLIC_DEMO_DOCTOR_KHAN_USERNAME",
      "doctor.khan",
    ),
    password: envOr(
      "NEXT_PUBLIC_DEMO_DOCTOR_KHAN_PASSWORD",
      "doctor123",
    ),
    userId: "user-doc-khan",
    displayName: "Dr. Imran Khan",
    role: "doctor",
    doctorId: "doc-khan",
    permissions: DOCTOR_PERMISSIONS,
  },
  {
    username: envOr(
      "NEXT_PUBLIC_DEMO_RECEPTION_USERNAME",
      "reception.sara",
    ),
    password: envOr(
      "NEXT_PUBLIC_DEMO_RECEPTION_PASSWORD",
      "reception123",
    ),
    userId: "user-reception-sara",
    displayName: "Sara Malik",
    role: "reception",
    permissions: RECEPTION_PERMISSIONS,
  },
];

export function authenticate(
  username: string,
  password: string,
): SessionUser | null {
  const account = DEMO_ACCOUNTS.find(
    (a) => a.username === username && a.password === password,
  );
  if (!account) return null;
  return {
    userId: account.userId,
    username: account.username,
    role: account.role,
    doctorId: account.doctorId,
  };
}

export function hasPermission(
  permissions: Permission[],
  required: Permission,
): boolean {
  return permissions.includes(required);
}

export function getPermissionsForUser(userId: string): Permission[] {
  const account = DEMO_ACCOUNTS.find((a) => a.userId === userId);
  return account?.permissions ?? [];
}

export function getHomePath(role: Role): string {
  switch (role) {
    case "admin":
      return "/admin";
    case "doctor":
      return "/doctor";
    case "reception":
      return "/reception";
    default:
      return "/";
  }
}
