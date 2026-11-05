"use client";

import { AppointmentTable } from "@/components/appointments/appointment-table";
import { useDemoReady } from "@/lib/hooks/use-demo-ready";
import { useAuthStore } from "@/lib/store/auth-store";
import { getDemoNow, toKarachiDateKey } from "@/lib/time";

export default function DoctorTodayPage() {
  const { ready, state } = useDemoReady();
  const doctorId = useAuthStore((s) => s.session?.doctorId);

  if (!ready || !state) {
    return <p className="text-sm text-muted">Loading schedule…</p>;
  }

  if (!doctorId) {
    return (
      <p className="text-sm text-muted">
        No doctor profile linked to this session. Sign in as a doctor account or
        use admin view-as from Demo Tools.
      </p>
    );
  }

  const todayKey = toKarachiDateKey(getDemoNow().toISOString());
  const appointments = state.appointments.filter(
    (a) =>
      a.doctorId === doctorId &&
      toKarachiDateKey(a.scheduledStartIso) === todayKey &&
      a.status !== "cancelled",
  );

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Today</h1>
      <p className="text-sm text-muted">
        Arrival lifecycle only — payment verification is not available for
        doctors. Payment clearance shown separately.
      </p>
      <AppointmentTable
        state={state}
        appointments={appointments}
        showDoctor={false}
        showPaymentVerify={false}
        showLifecycleActions
        emptyMessage="No appointments today for your schedule."
      />
    </div>
  );
}
