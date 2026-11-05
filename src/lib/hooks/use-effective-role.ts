"use client";

import { useAuthStore } from "@/lib/store/auth-store";
import { useDemoStore } from "@/lib/store/demo-store";
import type { Role } from "@/lib/types";

export function useEffectiveRole(): Role | null {
  const session = useAuthStore((s) => s.session);
  const viewingAs = useDemoStore((s) => s.viewingAs);
  if (!session) return null;
  return viewingAs ?? session.role;
}

export function useActorUserId(): string | undefined {
  return useAuthStore((s) => s.session?.userId);
}
