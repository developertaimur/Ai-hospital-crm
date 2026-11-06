import { create } from "zustand";
import { authenticate, DEMO_ACCOUNTS } from "@/lib/auth/demo-accounts";
import type { SessionUser, User } from "@/lib/types";

const SESSION_USERNAME_KEY = "lci-demo-username";

export interface AuthStore {
  session: SessionUser | null;
  login: (username: string, password: string, users?: User[]) => boolean;
  logout: () => void;
  restoreSession: (users?: User[]) => void;
}

function persistUsername(username: string | null): void {
  if (typeof window === "undefined") return;
  if (username) {
    sessionStorage.setItem(SESSION_USERNAME_KEY, username);
  } else {
    sessionStorage.removeItem(SESSION_USERNAME_KEY);
  }
}

export const useAuthStore = create<AuthStore>((set) => ({
  session: null,

  login: (username, password, users) => {
    const session = authenticate(username, password, users);
    if (!session) return false;
    persistUsername(username);
    set({ session });
    return true;
  },

  logout: () => {
    persistUsername(null);
    set({ session: null });
  },

  restoreSession: (users) => {
    if (typeof window === "undefined") return;
    const username = sessionStorage.getItem(SESSION_USERNAME_KEY);
    if (!username) return;

    if (users?.length) {
      const dynamic = users.find((u) => u.active && u.username === username);
      if (dynamic) {
        set({
          session: {
            userId: dynamic.id,
            username: dynamic.username,
            role: dynamic.role,
            doctorId: dynamic.doctorId,
          },
        });
        return;
      }
      const linkedSeed = users.find(
        (u) =>
          u.active &&
          DEMO_ACCOUNTS.some(
            (a) => a.userId === u.id && a.username === username,
          ),
      );
      if (linkedSeed) {
        set({
          session: {
            userId: linkedSeed.id,
            username: linkedSeed.username,
            role: linkedSeed.role,
            doctorId: linkedSeed.doctorId,
          },
        });
        return;
      }
    }

    const account = DEMO_ACCOUNTS.find((a) => a.username === username);
    if (!account) return;
    if (users?.length) {
      const linked = users.find((u) => u.id === account.userId);
      if (linked && !linked.active) return;
    }
    set({
      session: {
        userId: account.userId,
        username: account.username,
        role: account.role,
        doctorId: account.doctorId,
      },
    });
  },
}));

export { SESSION_USERNAME_KEY };
