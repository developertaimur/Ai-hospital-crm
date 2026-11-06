"use client";

import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useThemeStore } from "@/lib/store/theme-store";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  variant?: "icon" | "menu";
  className?: string;
}

export function ThemeToggle({
  variant = "icon",
  className,
}: ThemeToggleProps) {
  const theme = useThemeStore((s) => s.theme);
  const toggle = useThemeStore((s) => s.toggle);
  const isDark = theme === "dark";
  const label = isDark ? "Switch to light mode" : "Switch to dark mode";

  if (variant === "menu") {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={cn("w-full justify-start text-muted", className)}
        onClick={toggle}
        aria-label={label}
      >
        {isDark ? (
          <Sun className="size-4" aria-hidden />
        ) : (
          <Moon className="size-4" aria-hidden />
        )}
        {isDark ? "Light mode" : "Dark mode"}
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn("shrink-0 text-muted", className)}
      onClick={toggle}
      aria-label={label}
    >
      {isDark ? (
        <Sun className="size-4" aria-hidden />
      ) : (
        <Moon className="size-4" aria-hidden />
      )}
    </Button>
  );
}
