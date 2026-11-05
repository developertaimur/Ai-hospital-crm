"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useDemoReady } from "@/lib/hooks/use-demo-ready";
import { useAuthStore } from "@/lib/store/auth-store";
import { toast } from "@/components/ui/use-toast";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function DoctorAvailabilityPage() {
  const { ready, state } = useDemoReady();
  const doctorId = useAuthStore((s) => s.session?.doctorId);
  const [leaveStart, setLeaveStart] = useState("");
  const [leaveEnd, setLeaveEnd] = useState("");

  if (!ready || !state) {
    return <p className="text-sm text-muted">Loading…</p>;
  }

  if (!doctorId) {
    return (
      <p className="text-sm text-muted">Doctor profile required for availability.</p>
    );
  }

  const hours = state.workingHours.filter((h) => h.doctorId === doctorId);
  const leaves = state.leavePeriods.filter((l) => l.doctorId === doctorId);
  const breaks = state.breakPeriods.filter((b) => b.doctorId === doctorId);

  function checkLeaveConflict() {
    if (!leaveStart || !leaveEnd) return;
    const affected = state!.appointments.filter(
      (a) =>
        a.doctorId === doctorId &&
        a.status !== "cancelled" &&
        a.status !== "completed",
    );
    if (affected.length > 0) {
      toast({
        title: "Bookings may be affected",
        description: `${affected.length} active appointment(s) overlap this period. Staff must reschedule — not auto-updated in demo.`,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Leave recorded (surface only)",
        description: "Not saved to repository — staff resolution required for conflicts.",
      });
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Availability</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Regular hours</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          <ul>
            {hours.map((h) => (
              <li key={h.id}>
                {DAY_NAMES[h.dayOfWeek]} · {h.startTime}–{h.endTime}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Breaks</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          {breaks.length === 0 ? (
            <p className="text-muted">None configured.</p>
          ) : (
            <ul>
              {breaks.map((b) => (
                <li key={b.id}>
                  {b.label ?? "Break"} · {b.startTime}–{b.endTime}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Leave (demo surface)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {leaves.map((l) => (
            <p key={l.id} className="text-sm">
              {l.startDateKey} → {l.endDateKey}
              {l.reason ? ` · ${l.reason}` : ""}
            </p>
          ))}
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="lv-start">Start date</Label>
              <Input
                id="lv-start"
                type="date"
                value={leaveStart}
                onChange={(e) => setLeaveStart(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="lv-end">End date</Label>
              <Input
                id="lv-end"
                type="date"
                value={leaveEnd}
                onChange={(e) => setLeaveEnd(e.target.value)}
              />
            </div>
          </div>
          <Button type="button" variant="secondary" onClick={checkLeaveConflict}>
            Request leave (check conflicts)
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
