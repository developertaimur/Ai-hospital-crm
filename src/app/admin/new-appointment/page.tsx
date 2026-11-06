"use client";

import { BookingWizard } from "@/components/appointments/booking-wizard";
import { useDemoReady } from "@/lib/hooks/use-demo-ready";

export default function AdminNewAppointmentPage() {
  const { ready, state } = useDemoReady();

  if (!ready || !state) {
    return <p className="text-sm text-muted">Loading…</p>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-xl font-semibold sm:text-2xl">New appointment</h1>
      <p className="text-sm text-muted">
        Admin-only provisional reservation · demo fictional data
      </p>
      <BookingWizard state={state} />
    </div>
  );
}
