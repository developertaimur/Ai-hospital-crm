"use client";

import { useMemo } from "react";
import { AppointmentTable } from "@/components/appointments/appointment-table";
import { useDemoReady } from "@/lib/hooks/use-demo-ready";
import { useAuthStore } from "@/lib/store/auth-store";
import { getDemoNow, toKarachiDateKey } from "@/lib/time";
import { addDays } from "date-fns";

export default function DoctorWeekPage() {
  const { ready, state } = useDemoReady();
  const doctorId = useAuthStore((s) => s.session?.doctorId);

  const weekKeys = useMemo(() => {
    const start = getDemoNow();
    return Array.from({ length: 7 }, (_, i) => {
      const d = addDays(start, i);
      return toKarachiDateKey(d.toISOString());
    });
  }, []);

  if (!ready || !state) {
    return <p className="text-sm text-muted">Loading…</p>;
  }

  if (!doctorId) {
    return (
      <p className="text-sm text-muted">Link a doctor account to view the week.</p>
    );
  }

  const appointments = state.appointments.filter((a) => {
    if (a.doctorId !== doctorId || a.status !== "confirmed") return false;
    const key = toKarachiDateKey(a.scheduledStartIso);
    return weekKeys.includes(key);
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold sm:text-2xl">This week</h1>
      <p className="text-sm text-muted">
        Confirmed queue · {weekKeys[0]} → {weekKeys[6]} (Karachi)
      </p>
      <AppointmentTable
        state={state}
        appointments={appointments.sort((a, b) =>
          a.scheduledStartIso.localeCompare(b.scheduledStartIso),
        )}
        showDoctor={false}
        showPaymentVerify={false}
        showLifecycleActions
      />
    </div>
  );
}
