import type { DemoState } from "@/lib/types";
import type { DemoStoreAdapter } from "@/lib/mock/repository";

export function createInMemoryAdapter(
  initial: DemoState,
): DemoStoreAdapter & { forceFail: Record<string, boolean> } {
  let state = initial;
  const forceFail: Record<string, boolean> = {};
  return {
    forceFail,
    getState: () => state,
    setState: (next) => {
      state = next;
    },
    getForceFail: () => forceFail,
  };
}
