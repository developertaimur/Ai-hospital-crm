"use client";

import { AppointmentTable } from "@/components/appointments/appointment-table";
import { useDemoReady } from "@/lib/hooks/use-demo-ready";
import { getDemoNow, toKarachiDateKey } from "@/lib/time";

export default function ReceptionTodayPage() {
  const { ready, state } = useDemoReady();

  if (!ready || !state) {
    return <p className="text-sm text-muted">Loading…</p>;
  }

  const todayKey = toKarachiDateKey(getDemoNow().toISOString());
  const appointments = state.appointments.filter(
    (a) =>
      toKarachiDateKey(a.scheduledStartIso) === todayKey &&
      a.status !== "cancelled",
  );

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Today</h1>
      <AppointmentTable state={state} appointments={appointments} />
    </div>
  );
}
