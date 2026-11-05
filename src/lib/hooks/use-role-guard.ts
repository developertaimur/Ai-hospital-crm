"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getHomePath } from "@/lib/auth/demo-accounts";
import { canAccessRole } from "@/lib/auth/role-access";
import { useAuthStore } from "@/lib/store/auth-store";
import { useDemoStore } from "@/lib/store/demo-store";
import type { Role } from "@/lib/types";

export function useRoleGuard(allowed: Role | Role[]): boolean {
  const router = useRouter();
  const hydrated = useDemoStore((s) => s.hydrated);
  const session = useAuthStore((s) => s.session);
  const viewingAs = useDemoStore((s) => s.viewingAs);
  const roles = useMemo(
    () => (Array.isArray(allowed) ? allowed : [allowed]),
    [allowed],
  );
  const ok =
    !!session &&
    canAccessRole(session.role, viewingAs, roles);

  useEffect(() => {
    if (!hydrated) return;
    useDemoStore.getState().hydrate();
    const sess = useAuthStore.getState().session;
    if (!sess) {
      router.replace("/login");
      return;
    }
    const viewAs = useDemoStore.getState().viewingAs;
    if (!canAccessRole(sess.role, viewAs, roles)) {
      router.replace(getHomePath(sess.role));
    }
  }, [hydrated, router, roles]);

  return ok;
}
