"use client";

import Link from "next/link";
import {
  CalendarCheck2,
  CircleDollarSign,
  ClipboardList,
  PhoneForwarded,
  ShieldCheck,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { useDemoReady } from "@/lib/hooks/use-demo-ready";
import { formatPkr } from "@/lib/money";
import { getDemoNow, toKarachiDateKey } from "@/lib/time";
import { cn } from "@/lib/utils";

interface DashCard {
  href: string;
  label: string;
  value: number;
  hint: string;
  icon: LucideIcon;
  tone: string;
  valueClass?: string;
}

export default function AdminDashboardPage() {
  const { ready, state } = useDemoReady();
  if (!ready || !state) {
    return (
      <p className="text-sm text-muted" role="status">
        Loading dashboard…
      </p>
    );
  }

  const todayKey = toKarachiDateKey(getDemoNow().toISOString());
  const todayApts = state.appointments.filter(
    (a) => toKarachiDateKey(a.scheduledStartIso) === todayKey,
  );
  const awaitingPayment = state.appointments.filter(
    (a) => a.status === "awaiting_payment",
  ).length;
  const confirmed = state.appointments.filter(
    (a) => a.status === "confirmed",
  ).length;
  const pendingCallbacks = state.callbacks.filter(
    (c) =>
      c.status === "pending" ||
      c.status === "assigned" ||
      c.status === "in_progress",
  ).length;
  const verifiedPayments = state.payments.filter((p) => p.verified).length;
  const outstanding = state.appointments.filter(
    (a) =>
      a.paymentStatus === "unpaid" ||
      a.paymentStatus === "partial" ||
      a.paymentStatus === "review_required",
  ).length;
  const verifiedTotalPaisa = state.payments
    .filter((p) => p.verified)
    .reduce((sum, p) => sum + p.amountPaisa, 0);

  const cards: DashCard[] = [
    {
      href: "/admin/appointments",
      label: "Today's appointments",
      value: todayApts.length,
      hint: `Open today's schedule · ${todayKey}`,
      icon: ClipboardList,
      tone: "text-primary bg-primary/10",
    },
    {
      href: "/admin/payments",
      label: "Awaiting payment",
      value: awaitingPayment,
      hint: "Review provisional holds",
      icon: CircleDollarSign,
      tone: "text-warning bg-warning/10",
      valueClass: "text-warning",
    },
    {
      href: "/admin/appointments",
      label: "Confirmed",
      value: confirmed,
      hint: "All confirmed bookings",
      icon: CalendarCheck2,
      tone: "text-success bg-success/10",
      valueClass: "text-success",
    },
    {
      href: "/admin/callbacks",
      label: "Pending callbacks",
      value: pendingCallbacks,
      hint: "Assign or complete follow-ups",
      icon: PhoneForwarded,
      tone: "text-primary bg-primary/10",
    },
    {
      href: "/admin/payments",
      label: "Verified payments",
      value: verifiedPayments,
      hint: `Ledger total ${formatPkr(verifiedTotalPaisa)}`,
      icon: ShieldCheck,
      tone: "text-success bg-success/10",
      valueClass: "text-success",
    },
    {
      href: "/admin/payments",
      label: "Outstanding balances",
      value: outstanding,
      hint: "Unpaid, partial, or review required",
      icon: Wallet,
      tone: "text-warning bg-warning/10",
      valueClass: "text-warning",
    },
  ];

  return (
    <div className="space-y-6">
      <header className="relative overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(15,118,110,0.14),_transparent_55%),radial-gradient(ellipse_at_bottom_right,_rgba(15,118,110,0.06),_transparent_50%)]"
          aria-hidden
        />
        <div className="relative flex flex-col gap-4 p-5 sm:flex-row sm:items-end sm:justify-between sm:p-6">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
              Operations
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Dashboard
            </h1>
            <p className="max-w-xl text-sm text-muted">
              Karachi date {todayKey} · shared demo state · click a card to open
              details
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-primary/15 bg-primary/5 px-3 py-2 text-sm text-primary">
            <span className="relative flex size-2.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary/40 opacity-75" />
              <span className="relative inline-flex size-2.5 rounded-full bg-primary" />
            </span>
            Live metrics
          </div>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="group rounded-2xl border border-border bg-surface p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-muted">
                  {card.label}
                </p>
                <p
                  className={cn(
                    "mt-2 text-3xl font-semibold tabular-nums tracking-tight text-foreground",
                    card.valueClass,
                  )}
                >
                  {card.value}
                </p>
                <p className="mt-1 text-[11px] text-muted transition-colors group-hover:text-primary">
                  {card.hint} →
                </p>
              </div>
              <span
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105",
                  card.tone,
                )}
              >
                <card.icon className="size-5" aria-hidden />
              </span>
            </div>
          </Link>
        ))}
      </div>

      <section className="rounded-2xl border border-border bg-surface p-4 shadow-sm sm:p-5">
        <h2 className="text-lg font-semibold text-foreground">Quick links</h2>
        <p className="mt-1 text-sm text-muted">
          Jump to common Admin workflows.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {(
            [
              { href: "/admin/new-appointment", label: "New appointment" },
              { href: "/admin/calls", label: "Calls" },
              { href: "/admin/patients", label: "Patients" },
              { href: "/admin/doctors", label: "Doctors" },
              { href: "/admin/activity", label: "Activity" },
              { href: "/admin/demo-tools", label: "Demo tools" },
            ] as const
          ).map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
