"use client";

import { useEffect, type ReactNode } from "react";
import { Toaster } from "@/components/ui/toaster";
import { useAuthStore } from "@/lib/store/auth-store";
import { useDemoStore, useDemoVisibilityReconcile } from "@/lib/store/demo-store";
import { useThemeStore } from "@/lib/store/theme-store";

export function AppProviders({ children }: { children: ReactNode }) {
  const hydrate = useDemoStore((s) => s.hydrate);
  const hydrateTheme = useThemeStore((s) => s.hydrate);
  const setSession = useDemoStore((s) => s.setSession);
  const session = useAuthStore((s) => s.session);

  useDemoVisibilityReconcile();

  useEffect(() => {
    hydrateTheme();
  }, [hydrateTheme]);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    setSession(session);
  }, [session, setSession]);

  return (
    <>
      {children}
      <Toaster />
    </>
  );
}
