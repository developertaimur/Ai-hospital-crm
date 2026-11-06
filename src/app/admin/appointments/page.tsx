"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AppointmentTable } from "@/components/appointments/appointment-table";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { Panel } from "@/components/layout/panel";
import { useDemoReady } from "@/lib/hooks/use-demo-ready";
import { formatKarachi, getDemoNow, toKarachiDateKey } from "@/lib/time";
import type { AppointmentStatus, PaymentStatus } from "@/lib/types";

const OUTSTANDING_PAYMENTS: PaymentStatus[] = [
  "unpaid",
  "partial",
  "review_required",
];

export default function AdminAppointmentsPage() {
  const { ready, state } = useDemoReady();
  const searchParams = useSearchParams();
  const todayKey = toKarachiDateKey(getDemoNow().toISOString());

  const paramDate = searchParams.get("date");
  const paramStatus = searchParams.get("status") ?? "all";
  const paramPayment = searchParams.get("payment") ?? "all";
  const hasStatusFilter =
    paramStatus === "awaiting_payment" ||
    paramStatus === "confirmed" ||
    paramStatus === "cancelled" ||
    paramStatus === "expired" ||
    paramStatus === "completed" ||
    paramStatus === "no_show";
  const hasPaymentFilter =
    paramPayment === "outstanding" ||
    paramPayment === "unpaid" ||
    paramPayment === "partial" ||
    paramPayment === "cleared" ||
    paramPayment === "review_required";

  const initialDate =
    paramDate === "today" || paramDate === "1"
      ? todayKey
      : paramDate
        ? paramDate
        : hasStatusFilter || hasPaymentFilter
          ? ""
          : todayKey;

  const [doctorId, setDoctorId] = useState<string>("all");
  const [dateKey, setDateKey] = useState(initialDate);
  const [serviceId, setServiceId] = useState<string>("all");
  const [status, setStatus] = useState<string>(
    hasStatusFilter ? paramStatus : "all",
  );
  const [payment, setPayment] = useState<string>(
    hasPaymentFilter ? paramPayment : "all",
  );

  useEffect(() => {
    setDateKey(initialDate);
    setStatus(hasStatusFilter ? paramStatus : "all");
    setPayment(hasPaymentFilter ? paramPayment : "all");
  }, [
    initialDate,
    hasStatusFilter,
    hasPaymentFilter,
    paramStatus,
    paramPayment,
  ]);

  const filtered = useMemo(() => {
    if (!state) return [];
    return state.appointments
      .filter((a) => {
        if (doctorId !== "all" && a.doctorId !== doctorId) return false;
        if (dateKey && toKarachiDateKey(a.scheduledStartIso) !== dateKey)
          return false;
        if (serviceId !== "all" && a.serviceId !== serviceId) return false;
        if (status !== "all" && a.status !== status) return false;
        if (payment === "outstanding") {
          if (!OUTSTANDING_PAYMENTS.includes(a.paymentStatus)) return false;
        } else if (payment !== "all" && a.paymentStatus !== payment) {
          return false;
        }
        return true;
      })
      .slice()
      .sort((a, b) => a.scheduledStartIso.localeCompare(b.scheduledStartIso));
  }, [state, doctorId, dateKey, serviceId, status, payment]);

  if (!ready || !state) {
    return <p className="text-sm text-muted">Loading appointments…</p>;
  }

  const title =
    dateKey === todayKey && status === "all" && payment === "all"
      ? "Today’s appointments"
      : status === "awaiting_payment"
        ? "Awaiting payment"
        : status === "confirmed"
          ? "Confirmed appointments"
          : payment === "outstanding"
            ? "Outstanding balances"
            : "Appointments";

  const description = dateKey
    ? `Schedule for ${formatKarachi(`${dateKey}T12:00:00+05:00`, "EEEE, d MMMM yyyy")} · Asia/Karachi`
    : "All dates · change filters to narrow the list";

  return (
    <div className="space-y-6">
      <DashboardHeader
        eyebrow="Scheduling"
        title={title}
        description={description}
        badge={
          <Badge variant="secondary">
            {filtered.length} booking{filtered.length === 1 ? "" : "s"}
          </Badge>
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="rounded-xl"
              onClick={() => {
                setDateKey(todayKey);
                setStatus("all");
                setPayment("all");
                setDoctorId("all");
                setServiceId("all");
              }}
            >
              Today
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="rounded-xl"
              onClick={() => {
                setDateKey("");
                setStatus("all");
                setPayment("all");
              }}
            >
              Clear filters
            </Button>
          </div>
        }
      />

      <Panel title="Filters" description="Pick a date and status to review bookings.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <div className="space-y-1.5">
            <Label htmlFor="f-doctor">Doctor</Label>
            <Select value={doctorId} onValueChange={setDoctorId}>
              <SelectTrigger id="f-doctor" className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {state.doctors.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="f-date">Date</Label>
            <Input
              id="f-date"
              type="date"
              value={dateKey}
              onChange={(e) => setDateKey(e.target.value)}
              className="rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="f-service">Service</Label>
            <Select value={serviceId} onValueChange={setServiceId}>
              <SelectTrigger id="f-service" className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {state.services.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="f-status">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="f-status" className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {(
                  [
                    "awaiting_payment",
                    "confirmed",
                    "cancelled",
                    "expired",
                    "completed",
                    "no_show",
                  ] as AppointmentStatus[]
                ).map((s) => (
                  <SelectItem key={s} value={s}>
                    {s.replace("_", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="f-payment">Payment</Label>
            <Select value={payment} onValueChange={setPayment}>
              <SelectTrigger id="f-payment" className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="outstanding">Outstanding</SelectItem>
                {(
                  [
                    "unpaid",
                    "partial",
                    "cleared",
                    "review_required",
                  ] as PaymentStatus[]
                ).map((s) => (
                  <SelectItem key={s} value={s}>
                    {s.replace("_", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Panel>

      <Panel
        title="Results"
        description="Open a row for details, payment verification, and lifecycle actions."
      >
        <AppointmentTable state={state} appointments={filtered} />
      </Panel>
    </div>
  );
}
