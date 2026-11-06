"use client";

import Link from "next/link";
import { useMemo } from "react";
import { CalendarDays, ClipboardList } from "lucide-react";
import { addDays } from "date-fns";
import { AppointmentTable } from "@/components/appointments/appointment-table";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { Panel } from "@/components/layout/panel";
import { StatCard } from "@/components/layout/stat-card";
import { Button } from "@/components/ui/button";
import { useDemoReady } from "@/lib/hooks/use-demo-ready";
import { useAuthStore } from "@/lib/store/auth-store";
import { getDemoNow, toKarachiDateKey } from "@/lib/time";

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

  const appointments = state.appointments
    .filter((a) => {
      if (a.doctorId !== doctorId || a.status !== "confirmed") return false;
      const key = toKarachiDateKey(a.scheduledStartIso);
      return weekKeys.includes(key);
    })
    .sort((a, b) => a.scheduledStartIso.localeCompare(b.scheduledStartIso));

  const byDay = weekKeys.map((key) => ({
    key,
    count: appointments.filter(
      (a) => toKarachiDateKey(a.scheduledStartIso) === key,
    ).length,
  }));

  return (
    <div className="space-y-6">
      <DashboardHeader
        eyebrow="Doctor schedule"
        title="This week"
        description={`Confirmed queue · ${weekKeys[0]} → ${weekKeys[6]} · Asia/Karachi`}
        actions={
          <Button asChild size="sm" variant="secondary" className="rounded-xl">
            <Link href="/doctor">
              <CalendarDays className="size-4" aria-hidden />
              Today
            </Link>
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Confirmed this week"
          value={appointments.length}
          hint="Across 7 days"
          icon={ClipboardList}
          tone="primary"
        />
        {byDay.slice(0, 3).map((d) => (
          <StatCard
            key={d.key}
            label={d.key}
            value={d.count}
            hint="Confirmed"
            icon={CalendarDays}
            tone={d.count > 0 ? "success" : "muted"}
          />
        ))}
      </div>

      <Panel
        title="Weekly confirmed queue"
        description="Arrival updates apply the same as Today."
      >
        <AppointmentTable
          state={state}
          appointments={appointments}
          showDoctor={false}
          showPaymentVerify={false}
          showLifecycleActions
        />
      </Panel>
    </div>
  );
}
