"use client";

import { BookingWizard } from "@/components/appointments/booking-wizard";
import { useDemoReady } from "@/lib/hooks/use-demo-ready";

export default function ReceptionNewAppointmentPage() {
  const { ready, state } = useDemoReady();

  if (!ready || !state) {
    return <p className="text-sm text-muted">Loading…</p>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-semibold">New appointment</h1>
      <BookingWizard state={state} />
    </div>
  );
}
