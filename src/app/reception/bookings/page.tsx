"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { AppointmentTable } from "@/components/appointments/appointment-table";
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
import type { AppointmentStatus } from "@/lib/types";

const STATUS_FILTERS: Array<{ value: "all" | AppointmentStatus; label: string }> =
  [
    { value: "all", label: "All statuses" },
    { value: "confirmed", label: "Confirmed" },
    { value: "awaiting_payment", label: "Awaiting payment" },
    { value: "completed", label: "Completed" },
    { value: "no_show", label: "No show" },
    { value: "expired", label: "Expired" },
    { value: "cancelled", label: "Cancelled" },
  ];

export default function ReceptionBookingsStatusPage() {
  const { ready, state } = useDemoReady();
  const [search, setSearch] = useState("");
  const [doctorFilter, setDoctorFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | AppointmentStatus>(
    "all",
  );

  const filtered = useMemo(() => {
    if (!state) return [];
    const q = search.trim().toLowerCase();
    return state.appointments.filter((a) => {
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
  }, [state, doctorFilter, statusFilter, search]);

  if (!ready || !state) {
    return (
      <p className="text-sm text-muted" role="status">
        Loading booking statuses…
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Bookings status
        </h1>
        <p className="text-sm text-muted">
          View-only · demo fictional data. Confirm, cancel, reschedule, and
          payment verification are Admin-only.
        </p>
      </header>

      <section className="space-y-4 rounded-xl border border-border bg-surface p-4 shadow-sm sm:p-5">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="space-y-1.5 md:col-span-1">
            <Label htmlFor="reception-bookings-search">Search</Label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
                aria-hidden
              />
              <Input
                id="reception-bookings-search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Patient, ref, doctor…"
                className="pl-9"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reception-bookings-doctor">Doctor</Label>
            <Select value={doctorFilter} onValueChange={setDoctorFilter}>
              <SelectTrigger id="reception-bookings-doctor">
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
            <Label htmlFor="reception-bookings-status">Status</Label>
            <Select
              value={statusFilter}
              onValueChange={(v) =>
                setStatusFilter(v as "all" | AppointmentStatus)
              }
            >
              <SelectTrigger id="reception-bookings-status">
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
          showPaymentVerify={false}
          emptyMessage="No bookings match your filters."
        />
      </section>
    </div>
  );
}
