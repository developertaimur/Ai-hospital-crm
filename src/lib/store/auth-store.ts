import { create } from "zustand";
import { authenticate, DEMO_ACCOUNTS } from "@/lib/auth/demo-accounts";
import type { SessionUser } from "@/lib/types";

const SESSION_USERNAME_KEY = "lci-demo-username";

export interface AuthStore {
  session: SessionUser | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  restoreSession: () => void;
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

  login: (username, password) => {
    const session = authenticate(username, password);
    if (!session) return false;
    persistUsername(username);
    set({ session });
    return true;
  },

  logout: () => {
    persistUsername(null);
    set({ session: null });
  },

  restoreSession: () => {
    if (typeof window === "undefined") return;
    const username = sessionStorage.getItem(SESSION_USERNAME_KEY);
    if (!username) return;
    const account = DEMO_ACCOUNTS.find((a) => a.username === username);
    if (!account) return;
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
