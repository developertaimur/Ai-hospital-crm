"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useDemoReady } from "@/lib/hooks/use-demo-ready";
import { useState } from "react";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function ReceptionAvailabilityPage() {
  const { ready, state } = useDemoReady();
  const [doctorId, setDoctorId] = useState("");

  if (!ready || !state) {
    return <p className="text-sm text-muted">Loading…</p>;
  }

  const docId = doctorId || state.doctors[0]?.id || "";
  const hours = state.workingHours.filter((h) => h.doctorId === docId);
  const leaves = state.leavePeriods.filter((l) => l.doctorId === docId);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Doctor availability</h1>
      <div className="max-w-xs space-y-1">
        <Label htmlFor="av-doc">Doctor</Label>
        <Select value={docId} onValueChange={setDoctorId}>
          <SelectTrigger id="av-doc">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {state.doctors.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.displayName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Working hours</CardTitle>
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
          <CardTitle className="text-base">Leave periods</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          {leaves.length === 0 ? (
            <p className="text-muted">None on file.</p>
          ) : (
            leaves.map((l) => (
              <p key={l.id}>
                {l.startDateKey} → {l.endDateKey}
              </p>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
