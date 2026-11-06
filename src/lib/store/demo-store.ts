"use client";

import { create } from "zustand";
import { reconcileExpiredReservations } from "@/lib/mock/expiry";
import { clearState, loadState, saveState } from "@/lib/mock/persistence";
import type { DemoStoreAdapter } from "@/lib/mock/repository";
import * as repo from "@/lib/mock/repository";
import { createSeedState } from "@/lib/mock/seed";
import type { DemoState, Role, SessionUser } from "@/lib/types";
import { getDemoNow } from "@/lib/time";
import { useAuthStore } from "@/lib/store/auth-store";
import { useEffect } from "react";

export interface DemoStore {
  state: DemoState | null;
  hydrated: boolean;
  forceFail: Record<string, boolean>;
  viewingAs: Role | null;
  session: SessionUser | null;

  hydrate: () => void;
  persist: () => void;
  setSession: (session: SessionUser | null) => void;
  setViewingAs: (role: Role | null) => void;
  setForceFailOp: (opName: string, value: boolean) => void;
  applyState: (next: DemoState) => void;
  reconcileNow: () => void;
  getAdapter: () => DemoStoreAdapter;
}

function reconcile(state: DemoState): DemoState {
  return reconcileExpiredReservations(state, getDemoNow());
}

export const useDemoStore = create<DemoStore>((set, get) => ({
  state: null,
  hydrated: false,
  forceFail: {},
  viewingAs: null,
  session: null,

  hydrate: () => {
    if (get().hydrated) return;
    let loaded = loadState();
    if (!loaded) {
      loaded = createSeedState(getDemoNow());
      saveState(loaded);
    }
    loaded = reconcile(loaded);
    saveState(loaded);
    set({ state: loaded, hydrated: true });
    useAuthStore.getState().restoreSession(loaded.users);
    const authSession = useAuthStore.getState().session;
    if (authSession) {
      set({ session: authSession });
    }
  },

  persist: () => {
    const { state } = get();
    if (state) saveState(state);
  },

  setSession: (session) => set({ session }),

  setViewingAs: (role) => set({ viewingAs: role }),

  setForceFailOp: (opName, value) =>
    set({ forceFail: repo.setForceFail(get().forceFail, opName, value) }),

  applyState: (next) => {
    const reconciled = reconcile(next);
    set({ state: reconciled });
    saveState(reconciled);
  },

  reconcileNow: () => {
    const { state } = get();
    if (!state) return;
    const next = reconcile(state);
    set({ state: next });
    saveState(next);
  },

  getAdapter: (): DemoStoreAdapter => ({
    getState: () => {
      const s = get().state;
      if (!s) throw new Error("Demo state not hydrated");
      return s;
    },
    setState: (next) => get().applyState(next),
    getForceFail: () => get().forceFail,
  }),
}));

export async function withDemoRepo<T>(
  fn: (adapter: DemoStoreAdapter) => Promise<T>,
): Promise<T> {
  const store = useDemoStore.getState();
  if (!store.hydrated) store.hydrate();
  return fn(store.getAdapter());
}

export function useDemoVisibilityReconcile(): void {
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        useDemoStore.getState().reconcileNow();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);
}

export async function demoResetAll(): Promise<void> {
  clearState();
  const fresh = await withDemoRepo((a) => repo.resetDemoData(a));
  useDemoStore.setState({ state: fresh, forceFail: {}, viewingAs: null });
}

export {
  repo,
};
