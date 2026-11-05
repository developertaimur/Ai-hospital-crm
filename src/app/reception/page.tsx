"use client";

import { useMemo, useState } from "react";
import {
  CalendarCheck2,
  CircleDollarSign,
  ClipboardList,
  PhoneForwarded,
  Search,
} from "lucide-react";
import { AppointmentTable } from "@/components/appointments/appointment-table";
import { Card, CardContent } from "@/components/ui/card";
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
  bookingRef,
  doctorName,
  patientName,
  serviceName,
} from "@/lib/display/lookups";
import { getDemoNow, toKarachiDateKey } from "@/lib/time";
import type { AppointmentStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const STATUS_FILTERS: Array<{ value: "all" | AppointmentStatus; label: string }> =
  [
    { value: "all", label: "All statuses" },
    { value: "confirmed", label: "Confirmed" },
    { value: "awaiting_payment", label: "Awaiting payment" },
    { value: "completed", label: "Completed" },
    { value: "no_show", label: "No show" },
    { value: "expired", label: "Expired" },
  ];

export default function ReceptionTodayPage() {
  const { ready, state } = useDemoReady();
  const [search, setSearch] = useState("");
  const [doctorFilter, setDoctorFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | AppointmentStatus>(
    "all",
  );

  const todayKey = toKarachiDateKey(getDemoNow().toISOString());

  const todayAppointments = useMemo(() => {
    if (!state) return [];
    return state.appointments.filter(
      (a) =>
        toKarachiDateKey(a.scheduledStartIso) === todayKey &&
        a.status !== "cancelled",
    );
  }, [state, todayKey]);

  const summary = useMemo(() => {
    if (!state) {
      return {
        today: 0,
        confirmed: 0,
        awaiting: 0,
        pendingCallbacks: 0,
      };
    }
    return {
      today: todayAppointments.length,
      confirmed: todayAppointments.filter((a) => a.status === "confirmed")
        .length,
      awaiting: todayAppointments.filter((a) => a.status === "awaiting_payment")
        .length,
      pendingCallbacks: state.callbacks.filter(
        (c) =>
          c.status === "pending" ||
          c.status === "assigned" ||
          c.status === "in_progress",
      ).length,
    };
  }, [state, todayAppointments]);

  const filtered = useMemo(() => {
    if (!state) return [];
    const q = search.trim().toLowerCase();
    return todayAppointments.filter((a) => {
      if (doctorFilter !== "all" && a.doctorId !== doctorFilter) return false;
      if (statusFilter !== "all" && a.status !== statusFilter) return false;
      if (!q) return true;
      const hay = [
        patientName(state, a.patientId),
        bookingRef(a.id),
        doctorName(state, a.doctorId),
        serviceName(state, a.serviceId),
        a.status,
        a.paymentStatus,
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [state, todayAppointments, doctorFilter, statusFilter, search]);

  if (!ready || !state) {
    return (
      <p className="text-sm text-muted" role="status">
        Loading today’s appointments…
      </p>
    );
  }

  const cards = [
    {
      label: "Today’s appointments",
      value: summary.today,
      icon: ClipboardList,
      accent: "text-primary",
      ring: "ring-primary/15",
    },
    {
      label: "Confirmed",
      value: summary.confirmed,
      icon: CalendarCheck2,
      accent: "text-success",
      ring: "ring-success/15",
    },
    {
      label: "Awaiting payment",
      value: summary.awaiting,
      icon: CircleDollarSign,
      accent: "text-warning",
      ring: "ring-warning/15",
    },
    {
      label: "Pending callbacks",
      value: summary.pendingCallbacks,
      icon: PhoneForwarded,
      accent: "text-primary",
      ring: "ring-primary/15",
    },
  ] as const;

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Today
        </h1>
        <p className="text-sm text-muted">
          Reception desk · {todayKey} (Asia/Karachi) · demo fictional data
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Card
            key={card.label}
            className={cn(
              "overflow-hidden shadow-sm ring-1 ring-inset",
              card.ring,
            )}
          >
            <CardContent className="flex items-start gap-3 p-4">
              <span
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-lg bg-background",
                  card.accent,
                )}
              >
                <card.icon className="size-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-muted">
                  {card.label}
                </p>
                <p className="mt-1 text-3xl font-semibold tabular-nums text-foreground">
                  {card.value}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <section
        aria-label="Today’s appointment list"
        className="space-y-4 rounded-xl border border-border bg-surface p-4 shadow-sm sm:p-5"
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Appointments
            </h2>
            <p className="text-sm text-muted">
              Select a row to open booking details, AI call summary, and payment
              actions.
            </p>
          </div>
          <p className="text-xs text-muted lg:text-right">
            Showing {filtered.length} of {todayAppointments.length}
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="space-y-1.5 md:col-span-1">
            <Label htmlFor="reception-search">Search</Label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
                aria-hidden
              />
              <Input
                id="reception-search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Patient, ref, doctor…"
                className="pl-9"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reception-doctor">Doctor</Label>
            <Select value={doctorFilter} onValueChange={setDoctorFilter}>
              <SelectTrigger id="reception-doctor">
                <SelectValue placeholder="All doctors" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All doctors</SelectItem>
                {state.doctors.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reception-status">Status</Label>
            <Select
              value={statusFilter}
              onValueChange={(v) =>
                setStatusFilter(v as "all" | AppointmentStatus)
              }
            >
              <SelectTrigger id="reception-status">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_FILTERS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <AppointmentTable
          state={state}
          appointments={filtered}
          emptyMessage="No appointments match your search or filters for today."
        />
      </section>
    </div>
  );
}
