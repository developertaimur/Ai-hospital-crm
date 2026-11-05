import { describe, expect, it } from "vitest";
import {
  getHomePath,
  getPermissionsForUser,
  hasPermission,
} from "@/lib/auth/demo-accounts";
import { canAccessRole } from "@/lib/auth/role-access";

describe("role navigation and permissions", () => {
  it("getHomePath routes each role to its dashboard", () => {
    expect(getHomePath("admin")).toBe("/admin");
    expect(getHomePath("doctor")).toBe("/doctor");
    expect(getHomePath("reception")).toBe("/reception");
  });

  it("blocks cross-role access without admin view-as", () => {
    expect(canAccessRole("doctor", null, ["reception"])).toBe(false);
    expect(canAccessRole("reception", null, ["admin"])).toBe(false);
    expect(canAccessRole("doctor", null, ["doctor"])).toBe(true);
  });

  it("admin-only routes reject non-admin even when viewing as doctor", () => {
    expect(canAccessRole("doctor", null, ["admin"])).toBe(false);
    expect(canAccessRole("admin", "doctor", ["admin"])).toBe(true);
    expect(canAccessRole("admin", "doctor", ["doctor"])).toBe(true);
  });

  it("doctors lack verify_payment permission", () => {
    const perms = getPermissionsForUser("user-doc-ahmed");
    expect(hasPermission(perms, "verify_payment")).toBe(false);
    expect(hasPermission(perms, "view_own_schedule")).toBe(true);
  });

  it("reception can verify payments", () => {
    const perms = getPermissionsForUser("user-reception-sara");
    expect(hasPermission(perms, "verify_payment")).toBe(true);
  });
});
