"use client";

import { useMemo, useState } from "react";
import {
  CalendarOff,
  Clock3,
  Coffee,
  Stethoscope,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDemoReady } from "@/lib/hooks/use-demo-ready";
import { useAuthStore } from "@/lib/store/auth-store";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export default function DoctorAvailabilityPage() {
  const { ready, state } = useDemoReady();
  const doctorId = useAuthStore((s) => s.session?.doctorId);
  const [leaveStart, setLeaveStart] = useState("");
  const [leaveEnd, setLeaveEnd] = useState("");

  const doctor = useMemo(
    () => state?.doctors.find((d) => d.id === doctorId),
    [state, doctorId],
  );

  if (!ready || !state) {
    return (
      <p className="text-sm text-muted" role="status">
        Loading availability…
      </p>
    );
  }

  if (!doctorId) {
    return (
      <p className="text-sm text-muted">
        Doctor profile required for availability.
      </p>
    );
  }

  const hours = state.workingHours
    .filter((h) => h.doctorId === doctorId)
    .slice()
    .sort((a, b) => a.dayOfWeek - b.dayOfWeek);
  const leaves = state.leavePeriods.filter((l) => l.doctorId === doctorId);
  const breaks = state.breakPeriods.filter((b) => b.doctorId === doctorId);
  const workingDaySet = new Set(hours.map((h) => h.dayOfWeek));

  function checkLeaveConflict() {
    if (!leaveStart || !leaveEnd) {
      toast({
        title: "Select dates",
        description: "Choose a start and end date for the leave request.",
        variant: "destructive",
      });
      return;
    }
    const affected = state!.appointments.filter(
      (a) =>
        a.doctorId === doctorId &&
        a.status !== "cancelled" &&
        a.status !== "completed",
    );
    if (affected.length > 0) {
      toast({
        title: "Bookings may be affected",
        description: `${affected.length} active appointment(s) overlap this period. Staff must reschedule — not auto-updated in demo.`,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Leave recorded (surface only)",
        description:
          "Not saved to repository — staff resolution required for conflicts.",
      });
    }
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
              Schedule
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Availability
            </h1>
            <p className="max-w-xl text-sm text-muted">
              Working hours, breaks, and leave · demo surface · Asia/Karachi
            </p>
          </div>
          {doctor ? (
            <div className="flex items-center gap-2 rounded-xl border border-primary/15 bg-primary/5 px-3 py-2 text-sm text-primary">
              <Stethoscope className="size-4 shrink-0" aria-hidden />
              <span className="font-medium">{doctor.displayName}</span>
            </div>
          ) : null}
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          {
            label: "Working days",
            value: hours.length,
            icon: Clock3,
            tone: "text-primary bg-primary/10",
          },
          {
            label: "Breaks",
            value: breaks.length,
            icon: Coffee,
            tone: "text-warning bg-warning/10",
          },
          {
            label: "Leave periods",
            value: leaves.length,
            icon: CalendarOff,
            tone: "text-destructive bg-destructive/10",
          },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-border bg-surface p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted">
                  {card.label}
                </p>
                <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight text-foreground">
                  {card.value}
                </p>
              </div>
              <span
                className={cn(
                  "flex size-10 items-center justify-center rounded-xl",
                  card.tone,
                )}
              >
                <card.icon className="size-5" aria-hidden />
              </span>
            </div>
          </div>
        ))}
      </div>

      <section className="space-y-4 rounded-2xl border border-border bg-surface p-4 shadow-sm sm:p-5">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Clock3 className="size-5" aria-hidden />
          </span>
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Regular hours
            </h2>
            <p className="text-sm text-muted">
              Weekly clinic template for confirmed slots.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {DAY_NAMES.map((name, day) => {
            const active = workingDaySet.has(day);
            return (
              <div
                key={name}
                className={cn(
                  "rounded-xl border px-1 py-2 text-center text-[11px] font-semibold sm:text-xs",
                  active
                    ? "border-primary/25 bg-primary/10 text-primary"
                    : "border-border bg-background text-muted",
                )}
              >
                {name}
              </div>
            );
          })}
        </div>

        {hours.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-background px-4 py-8 text-center text-sm text-muted">
            No regular hours configured for this doctor.
          </p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {hours.map((h) => (
              <li
                key={h.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background px-3 py-3"
              >
                <span className="text-sm font-semibold text-foreground">
                  {DAY_NAMES[h.dayOfWeek]}
                </span>
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium tabular-nums text-primary">
                  {h.startTime}–{h.endTime}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-4 rounded-2xl border border-border bg-surface p-4 shadow-sm sm:p-5">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-warning/10 text-warning">
            <Coffee className="size-5" aria-hidden />
          </span>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Breaks</h2>
            <p className="text-sm text-muted">
              Blocked intervals inside working days.
            </p>
          </div>
        </div>

        {breaks.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-background px-4 py-8 text-center text-sm text-muted">
            No breaks configured.
          </p>
        ) : (
          <ul className="space-y-2">
            {breaks.map((b) => (
              <li
                key={b.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-background px-3 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {b.label ?? "Break"}
                  </p>
                  {b.dayOfWeek != null ? (
                    <p className="text-xs text-muted">
                      {DAY_NAMES[b.dayOfWeek]}
                    </p>
                  ) : null}
                </div>
                <span className="rounded-full bg-warning/10 px-2.5 py-1 text-xs font-medium tabular-nums text-warning">
                  {b.startTime}–{b.endTime}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-4 rounded-2xl border border-border bg-surface p-4 shadow-sm sm:p-5">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
            <CalendarOff className="size-5" aria-hidden />
          </span>
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Leave
            </h2>
            <p className="text-sm text-muted">
              Demo surface only — conflicts are flagged, not auto-rescheduled.
            </p>
          </div>
        </div>

        {leaves.length > 0 ? (
          <ul className="space-y-2">
            {leaves.map((l) => (
              <li
                key={l.id}
                className="rounded-xl border border-border bg-background px-3 py-3 text-sm"
              >
                <p className="font-medium tabular-nums text-foreground">
                  {l.startDateKey} → {l.endDateKey}
                </p>
                {l.reason ? (
                  <p className="mt-1 text-xs text-muted">{l.reason}</p>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-xl border border-dashed border-border bg-background px-4 py-6 text-center text-sm text-muted">
            No leave periods on file.
          </p>
        )}

        <div className="rounded-xl border border-border bg-background p-4">
          <p className="mb-3 text-sm font-semibold text-foreground">
            Request leave (demo)
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="lv-start">Start date</Label>
              <Input
                id="lv-start"
                type="date"
                value={leaveStart}
                onChange={(e) => setLeaveStart(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lv-end">End date</Label>
              <Input
                id="lv-end"
                type="date"
                value={leaveEnd}
                onChange={(e) => setLeaveEnd(e.target.value)}
              />
            </div>
          </div>
          <Button
            type="button"
            className="mt-4"
            variant="secondary"
            onClick={checkLeaveConflict}
          >
            Request leave (check conflicts)
          </Button>
        </div>
      </section>
    </div>
  );
}
