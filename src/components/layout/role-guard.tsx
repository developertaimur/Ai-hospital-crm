"use client";

import type { ReactNode } from "react";
import type { Role } from "@/lib/types";
import { useRoleGuard } from "@/lib/hooks/use-role-guard";
import { useDemoReady } from "@/lib/hooks/use-demo-ready";

export function RoleGuard({
  allowed,
  children,
}: {
  allowed: Role | Role[];
  children: ReactNode;
}) {
  const { ready } = useDemoReady();
  const ok = useRoleGuard(allowed);

  if (!ready || !ok) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted">
        Loading…
      </div>
    );
  }

  return <>{children}</>;
}
