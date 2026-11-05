"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getHomePath } from "@/lib/auth/demo-accounts";
import { useAuthStore } from "@/lib/store/auth-store";
import { useDemoStore } from "@/lib/store/demo-store";

export default function HomePage() {
  const router = useRouter();
  const hydrate = useDemoStore((s) => s.hydrate);
  const session = useAuthStore((s) => s.session);

  useEffect(() => {
    hydrate();
    useAuthStore.getState().restoreSession();
    const sess = useAuthStore.getState().session;
    if (!sess) {
      router.replace("/login");
      return;
    }
    router.replace(getHomePath(sess.role));
  }, [hydrate, router, session]);

  return (
    <div className="flex min-h-screen items-center justify-center text-sm text-muted">
      Redirecting…
    </div>
  );
}
