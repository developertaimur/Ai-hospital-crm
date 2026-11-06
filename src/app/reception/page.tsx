"use client";

import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import {
  ChevronRight,
  Clock3,
  Forward,
  PhoneIncoming,
  PhoneMissed,
  Search,
} from "lucide-react";
import { InboundCallDetailSheet } from "@/components/calls/inbound-call-detail-sheet";
import { LiveCallPanel } from "@/components/calls/live-call-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDemoReady } from "@/lib/hooks/use-demo-ready";
import {
  bookingOutcomeLabel,
  callerDisplayName,
  callerDisplayNumber,
  formatCallDuration,
} from "@/lib/display/lookups";
import { useLiveCallStore } from "@/lib/store/live-call-store";
import { formatKarachi } from "@/lib/time";
import type { BookingOutcome, CallRecord } from "@/lib/types";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";

const OUTCOME_FILTERS: Array<{ value: "all" | BookingOutcome; label: string }> =
  [
    { value: "all", label: "All outcomes" },
    { value: "provisional_reservation", label: "Provisional" },
    { value: "confirmed", label: "Confirmed" },
    { value: "forwarded_to_admin", label: "Forwarded to Admin" },
    { value: "callback_requested", label: "Callback requested" },
    { value: "none", label: "No booking" },
    { value: "abandoned", label: "Abandoned" },
  ];

function outcomeBadgeVariant(
  outcome?: BookingOutcome,
): "default" | "secondary" | "success" | "warning" | "destructive" {
  switch (outcome) {
    case "confirmed":
      return "success";
    case "provisional_reservation":
      return "warning";
    case "forwarded_to_admin":
    case "callback_requested":
      return "default";
    case "abandoned":
      return "destructive";
    default:
      return "secondary";
  }
}

type QuickFilter = "all" | "with_booking" | "no_booking" | "forwarded";

function callerInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

function matchesQuickFilter(call: CallRecord, filter: QuickFilter): boolean {
  switch (filter) {
    case "with_booking":
      return !!call.appointmentId;
    case "no_booking":
      return !call.appointmentId;
    case "forwarded":
      return !!call.forwardedToAdmin;
    default:
      return true;
  }
}

export default function ReceptionIncomingCallsPage() {
  const { ready, state } = useDemoReady();
  const [search, setSearch] = useState("");
  const [outcomeFilter, setOutcomeFilter] = useState<"all" | BookingOutcome>(
    "all",
  );
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const ringing = useLiveCallStore((s) => s.ringing);
  const live = useLiveCallStore((s) => s.live);
  const simulateIncomingCall = useLiveCallStore((s) => s.simulateIncomingCall);

  const aiEnabled = state?.hospitalSettings.aiReceptionEnabled !== false;

  useEffect(() => {
    if (!ready || !aiEnabled) return;
    const firstRing = window.setTimeout(() => {
      const { ringing: r, live: l } = useLiveCallStore.getState();
      if (!r && !l) simulateIncomingCall();
    }, 4500);
    return () => window.clearTimeout(firstRing);
  }, [ready, aiEnabled, simulateIncomingCall]);

  useEffect(() => {
    if (!ready || !aiEnabled) return;
    const interval = window.setInterval(() => {
      const { ringing: r, live: l } = useLiveCallStore.getState();
      if (!r && !l) simulateIncomingCall();
    }, 55000);
    return () => window.clearInterval(interval);
  }, [ready, aiEnabled, simulateIncomingCall]);

  const incomingCalls = useMemo(() => {
    if (!state) return [];
    return [...state.callRecords]
      .filter((c) => c.direction === "inbound")
      .sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  }, [state]);

  const summary = useMemo(() => {
    const withBooking = incomingCalls.filter((c) => !!c.appointmentId).length;
    const forwarded = incomingCalls.filter((c) => c.forwardedToAdmin).length;
    return {
      total: incomingCalls.length,
      withBooking,
      withoutBooking: incomingCalls.length - withBooking,
      forwarded,
    };
  }, [incomingCalls]);

  const filtered = useMemo(() => {
    if (!state) return [];
    const q = search.trim().toLowerCase();
    return incomingCalls.filter((c) => {
      if (!matchesQuickFilter(c, quickFilter)) return false;
      if (outcomeFilter !== "all" && c.bookingOutcome !== outcomeFilter) {
        return false;
      }
      if (!q) return true;
      const hay = [
        callerDisplayName(state, c),
        callerDisplayNumber(state, c),
        c.summary ?? "",
        bookingOutcomeLabel(c.bookingOutcome),
        c.language ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [state, incomingCalls, quickFilter, outcomeFilter, search]);

  function selectQuickFilter(next: QuickFilter) {
    setQuickFilter((current) =>
      next !== "all" && current === next ? "all" : next,
    );
  }

  const selected: CallRecord | null = useMemo(() => {
    if (!state || !selectedId) return null;
    return state.callRecords.find((c) => c.id === selectedId) ?? null;
  }, [state, selectedId]);

  function openCall(id: string) {
    setSelectedId(id);
  }

  function onRowKeyDown(e: KeyboardEvent<HTMLButtonElement>, id: string) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openCall(id);
    }
  }

  if (!ready || !state) {
    return (
      <p className="text-sm text-muted" role="status">
        Loading incoming calls…
      </p>
    );
  }

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
              Reception desk
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Incoming Calls
            </h1>
            <p className="max-w-xl text-sm text-muted">
              Live AI call monitor · view-only · Asia/Karachi
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 rounded-xl border border-primary/15 bg-primary/5 px-3 py-2 text-sm text-primary">
              <span className="relative flex size-2.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary/40 opacity-75" />
                <span className="relative inline-flex size-2.5 rounded-full bg-primary" />
              </span>
              {live
                ? "Live call active"
                : ringing
                  ? "Incoming call ringing"
                  : "Monitoring queue"}
            </div>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="gap-1.5"
              disabled={!!ringing || !!live}
              onClick={() => {
                const created = simulateIncomingCall();
                if (!created) {
                  toast({
                    title: "Busy",
                    description:
                      "Finish or dismiss the current ringing/live call first.",
                  });
                  return;
                }
                toast({
                  title: "Demo incoming call",
                  description: "Accept the popup to show it live on this page.",
                });
              }}
            >
              <PhoneIncoming className="size-4" aria-hidden />
              Simulate call
            </Button>
          </div>
        </div>
      </header>

      <LiveCallPanel state={state} />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {(
          [
            {
              id: "all" as const,
              label: "Total calls",
              value: summary.total,
              icon: PhoneIncoming,
              tone: "text-primary bg-primary/10",
            },
            {
              id: "with_booking" as const,
              label: "With booking",
              value: summary.withBooking,
              icon: Clock3,
              tone: "text-success bg-success/10",
            },
            {
              id: "no_booking" as const,
              label: "No booking",
              value: summary.withoutBooking,
              icon: PhoneMissed,
              tone: "text-warning bg-warning/10",
            },
            {
              id: "forwarded" as const,
              label: "Forwarded",
              value: summary.forwarded,
              icon: Forward,
              tone: "text-primary bg-primary/10",
            },
          ] as const
        ).map((card) => {
          const active = quickFilter === card.id;
          return (
            <button
              key={card.id}
              type="button"
              aria-pressed={active}
              onClick={() => selectQuickFilter(card.id)}
              className={cn(
                "group rounded-2xl border bg-surface p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active
                  ? "border-primary/40 ring-1 ring-primary/20 shadow-md"
                  : "border-border",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted">
                    {card.label}
                  </p>
                  <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight text-foreground">
                    {card.value}
                  </p>
                  <p className="mt-1 text-[11px] text-muted">
                    {active ? "Filtering call log" : "Click to filter"}
                  </p>
                </div>
                <span
                  className={cn(
                    "flex size-10 items-center justify-center rounded-xl transition-colors",
                    card.tone,
                  )}
                >
                  <card.icon className="size-5" aria-hidden />
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <section
        aria-label="Incoming call list"
        className="space-y-4 rounded-2xl border border-border bg-surface p-4 shadow-sm sm:p-5"
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Call log</h2>
            <p className="text-sm text-muted">
              Open a call for transcript, summary, booking status, and callback
              details.
            </p>
          </div>
          <p className="rounded-full bg-background px-3 py-1 text-xs font-medium text-muted ring-1 ring-border">
            Showing {filtered.length} of {incomingCalls.length}
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="reception-call-search">Search</Label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
                aria-hidden
              />
              <Input
                id="reception-call-search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Caller, number, outcome…"
                className="pl-9"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reception-call-outcome">Outcome</Label>
            <Select
              value={outcomeFilter}
              onValueChange={(v) =>
                setOutcomeFilter(v as "all" | BookingOutcome)
              }
            >
              <SelectTrigger id="reception-call-outcome">
                <SelectValue placeholder="All outcomes" />
              </SelectTrigger>
              <SelectContent>
                {OUTCOME_FILTERS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border bg-background px-4 py-12 text-center text-sm text-muted">
            No incoming calls match your filters.
          </p>
        ) : (
          <ul className="space-y-2">
            {filtered.map((call) => {
              const name = callerDisplayName(state, call);
              const isSelected = selectedId === call.id;
              return (
                <li key={call.id}>
                  <button
                    type="button"
                    aria-label={`Open call from ${name}`}
                    aria-pressed={isSelected}
                    onClick={() => openCall(call.id)}
                    onKeyDown={(e) => onRowKeyDown(e, call.id)}
                    className={cn(
                      "group flex w-full items-center gap-3 rounded-2xl border border-border bg-background px-3 py-3 text-left transition-all duration-200 hover:border-primary/25 hover:bg-primary/[0.03] hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:gap-4 sm:px-4",
                      isSelected &&
                        "border-primary/30 bg-primary/[0.06] shadow-sm ring-1 ring-primary/15",
                    )}
                  >
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary transition-transform duration-200 group-hover:scale-105">
                      {callerInitials(name)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-semibold text-foreground">
                          {name}
                        </p>
                        <Badge
                          variant={outcomeBadgeVariant(call.bookingOutcome)}
                          className="font-medium"
                        >
                          {bookingOutcomeLabel(call.bookingOutcome)}
                        </Badge>
                        {!call.appointmentId ? (
                          <span className="text-xs text-muted">No booking</span>
                        ) : null}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted sm:text-sm">
                        <span className="tabular-nums">
                          {callerDisplayNumber(state, call)}
                        </span>
                        <span className="tabular-nums">
                          {formatKarachi(call.startedAt, "dd MMM · hh:mm a")}
                        </span>
                        <span>
                          {formatCallDuration(call.durationSeconds)}
                        </span>
                        <span>
                          {call.language === "ur"
                            ? "Urdu"
                            : call.language === "en"
                              ? "English"
                              : "—"}
                        </span>
                      </div>
                    </div>
                    <ChevronRight
                      className="size-4 shrink-0 text-muted transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-primary"
                      aria-hidden
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <InboundCallDetailSheet
        open={!!selected}
        onOpenChange={(o) => !o && setSelectedId(null)}
        call={selected}
        state={state}
      />
    </div>
  );
}
