import { SCHEMA_VERSION, type DemoState } from "@/lib/types";
import { createSeedState } from "@/lib/mock/seed";
import { getDemoNow } from "@/lib/time";

export const STORAGE_KEY = "lci-hospital-crm-demo-v2";

export function loadState(): DemoState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DemoState;
    if (parsed.schemaVersion !== SCHEMA_VERSION) {
      return migrateOrReseed(parsed);
    }
    return parsed;
  } catch {
    return null;
  }
}

function migrateOrReseed(_legacy: unknown): DemoState {
  void _legacy;
  const fresh = createSeedState(getDemoNow());
  saveState(fresh);
  return fresh;
}

export function saveState(state: DemoState): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function clearState(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
