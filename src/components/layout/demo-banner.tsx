"use client";

import { useAuthStore } from "@/lib/store/auth-store";

export function DemoBanner() {
  const session = useAuthStore((s) => s.session);
  if (!session) return null;
  return (
    <div
      role="status"
      className="border-b border-warning/30 bg-warning/10 px-4 py-2 text-center text-sm text-foreground"
    >
      Demo — fictional data. Not connected to real patients or payments.
    </div>
  );
}
