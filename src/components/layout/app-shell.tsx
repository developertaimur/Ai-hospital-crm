"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, LogOut } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/store/auth-store";
import { DEMO_ACCOUNTS } from "@/lib/auth/demo-accounts";
import { DemoBanner } from "./demo-banner";
import { ViewingAsBanner } from "./viewing-as-banner";

export interface NavItem {
  href: string;
  label: string;
}

interface AppShellProps {
  title: string;
  subtitle?: string;
  nav: NavItem[];
  children: ReactNode;
}

export function AppShell({ title, subtitle, nav, children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const session = useAuthStore((s) => s.session);
  const logout = useAuthStore((s) => s.logout);
  const displayName =
    DEMO_ACCOUNTS.find((a) => a.userId === session?.userId)?.displayName ??
    session?.username;

  const navContent = (
    <nav className="flex flex-col gap-1 p-3" aria-label="Main">
      {nav.map((item) => {
        const active =
          pathname === item.href ||
          (item.href !== "/" && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary/10 text-primary"
                : "text-foreground hover:bg-background",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-screen flex-col">
      <DemoBanner />
      <ViewingAsBanner />
      <div className="flex flex-1">
        <aside className="hidden w-56 shrink-0 border-r border-border bg-surface md:flex md:flex-col">
          <div className="border-b border-border p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              Life Care International
            </p>
            <p className="text-sm font-semibold text-foreground">{title}</p>
            {subtitle ? (
              <p className="text-xs text-muted">{subtitle}</p>
            ) : null}
          </div>
          {navContent}
          <div className="mt-auto border-t border-border p-3">
            <p className="truncate px-3 text-xs text-muted">{displayName}</p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="mt-1 w-full justify-start"
              onClick={() => {
                logout();
                router.push("/login");
              }}
            >
              <LogOut className="size-4" aria-hidden />
              Sign out
            </Button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center gap-2 border-b border-border bg-surface px-4 py-3 md:hidden">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav"
              onClick={() => setMobileOpen((o) => !o)}
            >
              {mobileOpen ? <X /> : <Menu />}
              <span className="sr-only">Toggle menu</span>
            </Button>
            <div>
              <p className="text-sm font-semibold">{title}</p>
              <p className="text-xs text-muted">Life Care — Islamabad</p>
            </div>
          </header>
          {mobileOpen ? (
            <div
              id="mobile-nav"
              className="border-b border-border bg-surface md:hidden"
            >
              {navContent}
            </div>
          ) : null}
          <main className="flex-1 p-4 md:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
