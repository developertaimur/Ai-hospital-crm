"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  CalendarCheck2,
  CalendarX2,
  CircleDollarSign,
  ClipboardList,
  MessageCircle,
  PhoneForwarded,
  ShieldCheck,
} from "lucide-react";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { Panel } from "@/components/layout/panel";
import { StatCard } from "@/components/layout/stat-card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDemoReady } from "@/lib/hooks/use-demo-ready";
import { userDisplayName } from "@/lib/display/lookups";
import { formatPkr } from "@/lib/money";
import { formatKarachi, getDemoNow, toKarachiDateKey } from "@/lib/time";
import type { ActivityEventType, DemoState } from "@/lib/types";
import { cn } from "@/lib/utils";

const TYPE_FILTERS: Array<{ value: "all" | ActivityEventType; label: string }> =
  [
    { value: "all", label: "All types" },
    { value: "appointment_created", label: "Appointments booked" },
    { value: "appointment_confirmed", label: "Confirmed" },
    { value: "appointment_cancelled", label: "Cancelled" },
    { value: "appointment_rescheduled", label: "Rescheduled" },
    { value: "appointment_expired", label: "Expired" },
    { value: "payment_verified", label: "Payments verified" },
    { value: "payment_claim_created", label: "Payment claims" },
    { value: "whatsapp_booking", label: "WhatsApp bookings" },
    { value: "callback_updated", label: "Callbacks" },
    { value: "doctor_created", label: "Doctors" },
    { value: "settings_updated", label: "Settings" },
    { value: "demo_reset", label: "Demo reset" },
  ];

function dayTotals(state: DemoState, dateKey: string) {
  const appointmentsBooked = state.appointments.filter(
    (a) => toKarachiDateKey(a.createdAt) === dateKey,
  ).length;

  const scheduledConfirmed = state.appointments.filter(
    (a) =>
      a.status === "confirmed" &&
      toKarachiDateKey(a.scheduledStartIso) === dateKey,
  ).length;

  const cancelled = state.appointments.filter(
    (a) =>
      a.status === "cancelled" &&
      toKarachiDateKey(a.cancelledAt ?? a.updatedAt) === dateKey,
  ).length;

  const dayPayments = state.payments.filter(
    (p) =>
      p.verified && p.verifiedAt && toKarachiDateKey(p.verifiedAt) === dateKey,
  );
  const paymentReceivedPaisa = dayPayments.reduce(
    (sum, p) => sum + p.amountPaisa,
    0,
  );

  const paymentClaims = state.paymentClaims.filter(
    (c) => toKarachiDateKey(c.createdAt) === dateKey,
  ).length;

  const callbacks = state.callbacks.filter(
    (c) => toKarachiDateKey(c.updatedAt) === dateKey,
  ).length;

  const whatsappBookings = (state.whatsappConversations ?? []).filter(
    (c) => !!c.appointmentId && toKarachiDateKey(c.updatedAt) === dateKey,
  ).length;

  const calls = state.callRecords.filter(
    (c) => toKarachiDateKey(c.startedAt) === dateKey,
  ).length;

  const activityCount = state.activityEvents.filter(
    (e) => toKarachiDateKey(e.createdAt) === dateKey,
  ).length;

  return {
    appointmentsBooked,
    scheduledConfirmed,
    cancelled,
    paymentReceivedPaisa,
    paymentsCount: dayPayments.length,
    paymentClaims,
    callbacks,
    whatsappBookings,
    calls,
    activityCount,
  };
}

function typeBadgeVariant(
  type: ActivityEventType,
): "default" | "success" | "warning" | "destructive" | "secondary" {
  switch (type) {
    case "appointment_confirmed":
    case "payment_verified":
    case "whatsapp_booking":
      return "success";
    case "appointment_cancelled":
    case "appointment_expired":
      return "destructive";
    case "appointment_created":
    case "payment_claim_created":
    case "callback_updated":
      return "warning";
    default:
      return "secondary";
  }
}

export default function AdminActivityPage() {
  const { ready, state } = useDemoReady();
  const todayKey = toKarachiDateKey(getDemoNow().toISOString());
  const [dateKey, setDateKey] = useState(todayKey);
  const [typeFilter, setTypeFilter] = useState<"all" | ActivityEventType>(
    "all",
  );

  const totals = useMemo(
    () => (state ? dayTotals(state, dateKey) : null),
    [state, dateKey],
  );

  const events = useMemo(() => {
    if (!state) return [];
    return state.activityEvents
      .filter((e) => toKarachiDateKey(e.createdAt) === dateKey)
      .filter((e) => (typeFilter === "all" ? true : e.type === typeFilter))
      .slice()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [state, dateKey, typeFilter]);

  const availableDates = useMemo(() => {
    if (!state) return [todayKey];
    const keys = new Set<string>([todayKey]);
    for (const e of state.activityEvents) {
      keys.add(toKarachiDateKey(e.createdAt));
    }
    for (const a of state.appointments) {
      keys.add(toKarachiDateKey(a.createdAt));
      keys.add(toKarachiDateKey(a.scheduledStartIso));
    }
    for (const p of state.payments) {
      if (p.verifiedAt) keys.add(toKarachiDateKey(p.verifiedAt));
    }
    return Array.from(keys).sort((a, b) => b.localeCompare(a));
  }, [state, todayKey]);

  if (!ready || !state || !totals) {
    return <p className="text-sm text-muted">Loading activity…</p>;
  }

  const dateLabel =
    dateKey === todayKey
      ? `Today · ${dateKey}`
      : formatKarachi(`${dateKey}T12:00:00+05:00`, "EEEE, d MMMM yyyy");

  return (
    <div className="space-y-6">
      <DashboardHeader
        eyebrow="Audit & ops"
        title="Activity"
        description="Day-wise hospital activity — bookings, payments, WhatsApp, and staff actions."
        badge={<Badge variant="secondary">Demo data</Badge>}
        actions={
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="activity-date" className="text-xs">
                Select date
              </Label>
              <Input
                id="activity-date"
                type="date"
                value={dateKey}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v) setDateKey(v);
                }}
                className="h-9 w-[11.5rem] rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="activity-preset" className="text-xs">
                Quick pick
              </Label>
              <Select
                value={availableDates.includes(dateKey) ? dateKey : todayKey}
                onValueChange={setDateKey}
              >
                <SelectTrigger
                  id="activity-preset"
                  className="h-9 w-[11.5rem] rounded-xl"
                >
                  <SelectValue placeholder="Pick a day" />
                </SelectTrigger>
                <SelectContent>
                  {availableDates.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d === todayKey ? `${d} (today)` : d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        }
      />

      <p className="text-sm text-muted">
        Showing totals and events for{" "}
        <strong className="text-foreground">{dateLabel}</strong>
      </p>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Appointments booked"
          value={totals.appointmentsBooked}
          hint="Created this day"
          icon={ClipboardList}
          tone="primary"
        />
        <StatCard
          label="Payment received"
          value={formatPkr(totals.paymentReceivedPaisa)}
          hint={`${totals.paymentsCount} verified payment${totals.paymentsCount === 1 ? "" : "s"}`}
          icon={CircleDollarSign}
          tone="success"
        />
        <StatCard
          label="Confirmed on schedule"
          value={totals.scheduledConfirmed}
          hint="Confirmed for this date"
          icon={CalendarCheck2}
          tone="success"
        />
        <StatCard
          label="Cancelled"
          value={totals.cancelled}
          hint="Cancelled this day"
          icon={CalendarX2}
          tone="warning"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="WhatsApp bookings"
          value={totals.whatsappBookings}
          hint="Chats linked to holds"
          icon={MessageCircle}
          tone="primary"
        />
        <StatCard
          label="Callbacks touched"
          value={totals.callbacks}
          hint="Updated this day"
          icon={PhoneForwarded}
          tone="warning"
        />
        <StatCard
          label="Inbound calls"
          value={totals.calls}
          hint="Call records this day"
          icon={Activity}
          tone="muted"
        />
        <StatCard
          label="Payment claims"
          value={totals.paymentClaims}
          hint="Claims submitted"
          icon={ShieldCheck}
          tone="warning"
        />
      </div>

      <Panel
        title="Activity feed"
        description={`${totals.activityCount} logged event${totals.activityCount === 1 ? "" : "s"} on this date · filter by type`}
        action={
          <div className="w-full sm:w-52">
            <Select
              value={typeFilter}
              onValueChange={(v) =>
                setTypeFilter(v as "all" | ActivityEventType)
              }
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                {TYPE_FILTERS.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      >
        {events.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border bg-background px-4 py-12 text-center text-sm text-muted">
            No activity events for this date
            {typeFilter !== "all" ? " and type filter" : ""}.
          </p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border/80">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>When</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Entity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="whitespace-nowrap tabular-nums text-muted">
                      {formatKarachi(e.createdAt, "hh:mm a")}
                    </TableCell>
                    <TableCell>
                      <Badge variant={typeBadgeVariant(e.type)}>
                        {e.type.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {e.actorUserId
                        ? userDisplayName(state, e.actorUserId)
                        : "System / AI"}
                    </TableCell>
                    <TableCell className="max-w-md">
                      <span className="line-clamp-2">{e.message}</span>
                    </TableCell>
                    <TableCell className="text-xs text-muted">
                      {e.entityType && e.entityId ? (
                        <span className={cn("font-mono")}>
                          {e.entityType}:{e.entityId.slice(-8)}
                        </span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Panel>
    </div>
  );
}
