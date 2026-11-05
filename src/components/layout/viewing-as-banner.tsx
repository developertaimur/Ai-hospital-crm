"use client";

import { Button } from "@/components/ui/button";
import { useDemoStore } from "@/lib/store/demo-store";
import { useAuthStore } from "@/lib/store/auth-store";

export function ViewingAsBanner() {
  const session = useAuthStore((s) => s.session);
  const viewingAs = useDemoStore((s) => s.viewingAs);
  const setViewingAs = useDemoStore((s) => s.setViewingAs);

  if (!session || session.role !== "admin" || !viewingAs) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-primary/20 bg-primary/5 px-4 py-2 text-sm">
      <span>
        Viewing as <strong className="capitalize">{viewingAs}</strong> (admin
        preview)
      </span>
      <Button
        type="button"
        size="sm"
        variant="secondary"
        onClick={() => setViewingAs(null)}
      >
        Return to admin
      </Button>
    </div>
  );
}
