"use client";

import { useMemo, useState } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { AppointmentTable } from "@/components/appointments/appointment-table";
import { useDemoReady } from "@/lib/hooks/use-demo-ready";
import { toKarachiDateKey } from "@/lib/time";
import type { AppointmentStatus, PaymentStatus } from "@/lib/types";

export default function AdminAppointmentsPage() {
  const { ready, state } = useDemoReady();
  const [doctorId, setDoctorId] = useState<string>("all");
  const [dateKey, setDateKey] = useState("");
  const [serviceId, setServiceId] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [payment, setPayment] = useState<string>("all");

  const filtered = useMemo(() => {
    if (!state) return [];
    return state.appointments.filter((a) => {
      if (doctorId !== "all" && a.doctorId !== doctorId) return false;
      if (dateKey && toKarachiDateKey(a.scheduledStartIso) !== dateKey)
        return false;
      if (serviceId !== "all" && a.serviceId !== serviceId) return false;
      if (status !== "all" && a.status !== status) return false;
      if (payment !== "all" && a.paymentStatus !== payment) return false;
      return true;
    });
  }, [state, doctorId, dateKey, serviceId, status, payment]);

  if (!ready || !state) {
    return <p className="text-sm text-muted">Loading appointments…</p>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold sm:text-2xl">Appointments</h1>
      <div className="grid gap-3 rounded-xl border border-border bg-surface p-3 sm:grid-cols-2 sm:p-4 lg:grid-cols-3 xl:grid-cols-5">
        <div className="space-y-1">
          <Label htmlFor="f-doctor">Doctor</Label>
          <Select value={doctorId} onValueChange={setDoctorId}>
            <SelectTrigger id="f-doctor">
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
        <div className="space-y-1">
          <Label htmlFor="f-date">Date</Label>
          <Input
            id="f-date"
            type="date"
            value={dateKey}
            onChange={(e) => setDateKey(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="f-service">Service</Label>
          <Select value={serviceId} onValueChange={setServiceId}>
            <SelectTrigger id="f-service">
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
        <div className="space-y-1">
          <Label htmlFor="f-status">Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger id="f-status">
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
        <div className="space-y-1">
          <Label htmlFor="f-payment">Payment</Label>
          <Select value={payment} onValueChange={setPayment}>
            <SelectTrigger id="f-payment">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {(
                ["unpaid", "partial", "cleared", "review_required"] as PaymentStatus[]
              ).map((s) => (
                <SelectItem key={s} value={s}>
                  {s.replace("_", " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <AppointmentTable state={state} appointments={filtered} />
    </div>
  );
}
