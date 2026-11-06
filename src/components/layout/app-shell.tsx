"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  CalendarCheck2,
  CalendarClock,
  CalendarDays,
  ClipboardList,
  Cross,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  PhoneCall,
  PhoneIncoming,
  Settings,
  Stethoscope,
  UserRound,
  Users,
  Wallet,
  Wrench,
  X,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/store/auth-store";
import { DEMO_ACCOUNTS } from "@/lib/auth/demo-accounts";
import { ThemeToggle } from "./theme-toggle";
import { ViewingAsBanner } from "./viewing-as-banner";

export interface NavItem {
  href: string;
  label: string;
  icon?: LucideIcon;
}

const FALLBACK_ICONS: Record<string, LucideIcon> = {
  "/admin": LayoutDashboard,
  "/admin/appointments": ClipboardList,
  "/admin/new-appointment": CalendarCheck2,
  "/admin/doctors": Stethoscope,
  "/admin/patients": Users,
  "/admin/payments": Wallet,
  "/admin/calls": PhoneCall,
  "/admin/whatsapp": MessageCircle,
  "/admin/callbacks": PhoneIncoming,
  "/admin/staff": UserRound,
  "/admin/settings": Settings,
  "/admin/activity": Activity,
  "/admin/demo-tools": Wrench,
  "/doctor": CalendarDays,
  "/doctor/week": CalendarClock,
  "/doctor/availability": CalendarCheck2,
  "/reception": PhoneIncoming,
  "/reception/whatsapp": MessageCircle,
  "/reception/bookings": ClipboardList,
  "/reception/callbacks": PhoneCall,
};

interface AppShellProps {
  title: string;
  subtitle?: string;
  nav: NavItem[];
  /** Rendered directly under the nav links (e.g. Test call). */
  navExtra?: ReactNode;
  children: ReactNode;
}

function initialsFromName(name?: string): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

export function AppShell({
  title,
  subtitle,
  nav,
  navExtra,
  children,
}: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  /** Path the drawer was opened on — auto-closes when the route changes. */
  const [mobileMenuPath, setMobileMenuPath] = useState<string | null>(null);
  const mobileOpen = mobileMenuPath === pathname;
  const closeMobile = () => setMobileMenuPath(null);
  const toggleMobile = () =>
    setMobileMenuPath((p) => (p === pathname ? null : pathname));
  const session = useAuthStore((s) => s.session);
  const logout = useAuthStore((s) => s.logout);
  const displayName =
    DEMO_ACCOUNTS.find((a) => a.userId === session?.userId)?.displayName ??
    session?.username;

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileMenuPath(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  const navContent = (
    <nav className="flex flex-col gap-1 p-3" aria-label="Main">
      <p className="px-2.5 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
        Menu
      </p>
      {nav.map((item) => {
        const active = pathname === item.href;
        const Icon = item.icon ?? FALLBACK_ICONS[item.href] ?? LayoutDashboard;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={closeMobile}
            className={cn(
              "group flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm font-medium transition-colors duration-150",
              active
                ? "bg-accent-soft text-primary"
                : "text-foreground/75 hover:bg-background hover:text-foreground",
            )}
          >
            <span
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "bg-transparent text-muted group-hover:text-primary",
              )}
            >
              <Icon className="size-4" aria-hidden />
            </span>
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
      {navExtra ? (
        <div
          className="mt-2 border-t border-border/70 pt-3"
          onClick={closeMobile}
        >
          {navExtra}
        </div>
      ) : null}
    </nav>
  );

  const brandBlock = (
    <div className="border-b border-border/70 p-4">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm shadow-primary/20">
          <Cross className="size-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">
            Life Care International
          </p>
          <p className="mt-0.5 truncate text-sm font-semibold text-foreground">
            {title}
          </p>
          {subtitle ? (
            <p className="mt-0.5 text-xs leading-snug text-muted">{subtitle}</p>
          ) : null}
        </div>
      </div>
    </div>
  );

  const userFooter = (
    <div className="border-t border-border/70 p-3">
      <div className="rounded-2xl border border-border/80 bg-background p-3">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-primary">
            {initialsFromName(displayName)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">
              {displayName}
            </p>
            <p className="truncate text-[11px] capitalize text-muted">
              {session?.role ?? "staff"} · Islamabad
            </p>
          </div>
        </div>
        <ThemeToggle variant="menu" className="mt-2" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mt-1 w-full justify-start text-muted hover:text-destructive"
          onClick={() => {
            logout();
            router.push("/login");
          }}
        >
          <LogOut className="size-4" aria-hidden />
          Sign out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-dvh flex-col overflow-x-hidden">
      <ViewingAsBanner />
      <div className="flex min-w-0 flex-1">
        <aside className="hidden w-[15.5rem] shrink-0 border-r border-border/80 bg-surface md:flex md:flex-col">
          {brandBlock}
          <div className="flex-1 overflow-y-auto">{navContent}</div>
          <div className="mt-auto">{userFooter}</div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col bg-background">
          <div className="relative sticky top-0 z-40 md:hidden">
            <header className="relative z-50 flex items-center gap-1.5 border-b border-border/80 bg-surface/95 px-2 py-2.5 backdrop-blur supports-[backdrop-filter]:bg-surface/90 sm:gap-2 sm:px-4 sm:py-3">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0"
                aria-expanded={mobileOpen}
                aria-controls="mobile-nav"
                onClick={toggleMobile}
              >
                {mobileOpen ? <X /> : <Menu />}
                <span className="sr-only">Toggle menu</span>
              </Button>
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Cross className="size-4" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{title}</p>
                  <p className="truncate text-xs text-muted">
                    {displayName ?? "Life Care — Islamabad"}
                  </p>
                </div>
              </div>
              <ThemeToggle />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0 text-muted hover:text-destructive sm:hidden"
                aria-label="Sign out"
                onClick={() => {
                  logout();
                  router.push("/login");
                }}
              >
                <LogOut className="size-4" aria-hidden />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="hidden shrink-0 gap-1.5 text-muted hover:text-destructive sm:inline-flex"
                onClick={() => {
                  logout();
                  router.push("/login");
                }}
              >
                <LogOut className="size-4" aria-hidden />
                Sign out
              </Button>
            </header>

            {mobileOpen ? (
              <>
                <button
                  type="button"
                  aria-label="Close menu"
                  className="fixed inset-0 z-40 bg-slate-900/40"
                  onClick={closeMobile}
                />
                <div
                  id="mobile-nav"
                  className="absolute inset-x-0 top-full z-50 max-h-[min(78dvh,calc(100dvh-3.5rem))] overflow-y-auto border-b border-border bg-surface shadow-lg"
                >
                  {navContent}
                  {userFooter}
                </div>
              </>
            ) : null}
          </div>

          <main className="min-w-0 flex-1 overflow-x-hidden p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-5 md:p-6 lg:p-7">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
