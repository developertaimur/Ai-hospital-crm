"use client";

import { create } from "zustand";
import {
  THEME_STORAGE_KEY,
  type ThemeMode,
} from "@/lib/theme";

export type { ThemeMode };

export interface ThemeStore {
  theme: ThemeMode;
  hydrated: boolean;
  hydrate: () => void;
  setTheme: (theme: ThemeMode) => void;
  toggle: () => void;
}

function applyThemeClass(theme: ThemeMode): void {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.style.colorScheme = theme;
}

function readStoredTheme(): ThemeMode {
  if (typeof window === "undefined") return "light";
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    if (raw === "dark" || raw === "light") return raw;
  } catch {
    /* ignore */
  }
  return "light";
}

export const useThemeStore = create<ThemeStore>((set, get) => ({
  theme: "light",
  hydrated: false,

  hydrate: () => {
    const theme = readStoredTheme();
    applyThemeClass(theme);
    set({ theme, hydrated: true });
  },

  setTheme: (theme) => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      /* ignore */
    }
    applyThemeClass(theme);
    set({ theme });
  },

  toggle: () => {
    const next: ThemeMode = get().theme === "dark" ? "light" : "dark";
    get().setTheme(next);
  },
}));
