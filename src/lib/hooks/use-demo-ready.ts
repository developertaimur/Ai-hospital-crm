"use client";

import { useEffect } from "react";
import { useDemoStore } from "@/lib/store/demo-store";
import type { DemoState } from "@/lib/types";

export function useDemoReady(): {
  ready: boolean;
  state: DemoState | null;
} {
  const hydrated = useDemoStore((s) => s.hydrated);
  const state = useDemoStore((s) => s.state);
  const hydrate = useDemoStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return { ready: hydrated && !!state, state };
}
