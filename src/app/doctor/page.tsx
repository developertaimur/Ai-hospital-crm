"use client";

import Link from "next/link";
import {
  CalendarCheck2,
  CalendarClock,
  ClipboardList,
  Users,
} from "lucide-react";
import { AppointmentTable } from "@/components/appointments/appointment-table";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { Panel } from "@/components/layout/panel";
import { StatCard } from "@/components/layout/stat-card";
import { Button } from "@/components/ui/button";
import { useDemoReady } from "@/lib/hooks/use-demo-ready";
import { useAuthStore } from "@/lib/store/auth-store";
import { formatKarachi, getDemoNow, toKarachiDateKey } from "@/lib/time";

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
        use admin view-as from Tools.
      </p>
    );
  }

  const now = getDemoNow();
  const todayKey = toKarachiDateKey(now.toISOString());
  const todayLabel = formatKarachi(now.toISOString(), "EEEE, d MMMM yyyy");
  const appointments = state.appointments.filter(
    (a) =>
      a.doctorId === doctorId &&
      toKarachiDateKey(a.scheduledStartIso) === todayKey &&
      a.status === "confirmed",
  );
  const arrived = appointments.filter((a) => a.arrivalStatus === "arrived").length;
  const inConsult = appointments.filter(
    (a) => a.arrivalStatus === "in_consultation",
  ).length;
  const completed = appointments.filter(
    (a) => a.arrivalStatus === "completed",
  ).length;

  return (
    <div className="space-y-6">
      <DashboardHeader
        eyebrow="Doctor schedule"
        title="Today’s queue"
        description={`${todayLabel} · confirmed appointments only · Asia/Karachi`}
        actions={
          <Button asChild size="sm" variant="secondary" className="rounded-xl">
            <Link href="/doctor/week">
              <CalendarClock className="size-4" aria-hidden />
              This week
            </Link>
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Confirmed today"
          value={appointments.length}
          hint="On your schedule"
          icon={ClipboardList}
          tone="primary"
        />
        <StatCard
          label="Arrived"
          value={arrived}
          hint="Waiting room"
          icon={Users}
          tone="warning"
        />
        <StatCard
          label="In consultation"
          value={inConsult}
          hint="With you now"
          icon={CalendarCheck2}
          tone="primary"
        />
        <StatCard
          label="Completed"
          value={completed}
          hint="Finished today"
          icon={CalendarCheck2}
          tone="success"
        />
      </div>

      <Panel
        title="Confirmed appointments"
        description="Update arrival lifecycle here. Payment verification is Admin-only."
      >
        <AppointmentTable
          state={state}
          appointments={appointments}
          showDoctor={false}
          showPaymentVerify={false}
          showLifecycleActions
          emptyMessage="No appointments today for your schedule."
        />
      </Panel>
    </div>
  );
}
