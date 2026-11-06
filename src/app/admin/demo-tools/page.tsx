"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import {
  demoResetAll,
  useDemoStore,
  withDemoRepo,
} from "@/lib/store/demo-store";
import * as repo from "@/lib/mock/repository";
import { useDemoReady } from "@/lib/hooks/use-demo-ready";
import type { Role } from "@/lib/types";
import { formatKarachi, getDemoNow } from "@/lib/time";

const FAIL_OPS = [
  "createReservation",
  "recordVerifiedPayment",
  "rescheduleAppointment",
  "cancelAppointment",
  "resetDemoData",
  "advanceDemoTime",
];

export default function AdminDemoToolsPage() {
  const { ready, state } = useDemoReady();
  const forceFail = useDemoStore((s) => s.forceFail);
  const setForceFailOp = useDemoStore((s) => s.setForceFailOp);
  const setViewingAs = useDemoStore((s) => s.setViewingAs);
  const viewingAs = useDemoStore((s) => s.viewingAs);
  const [minutes, setMinutes] = useState("60");
  const [busy, setBusy] = useState(false);

  if (!ready || !state) {
    return <p className="text-sm text-muted">Loading demo tools…</p>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold sm:text-2xl">Demo tools</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Demo clock</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          Current demo time (Karachi):{" "}
          <strong>
            {formatKarachi(getDemoNow().toISOString(), "dd MMM yyyy · hh:mm a")}
          </strong>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">View as role</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <Label htmlFor="view-as">Preview UI as</Label>
            <Select
              value={viewingAs ?? "none"}
              onValueChange={(v) =>
                setViewingAs(v === "none" ? null : (v as Role))
              }
            >
              <SelectTrigger id="view-as" className="w-full sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Admin only</SelectItem>
                <SelectItem value="doctor">Doctor</SelectItem>
                <SelectItem value="reception">Reception</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-muted">
            Opens doctor/reception routes while keeping admin session.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Advance time</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Input
            className="w-28"
            type="number"
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            aria-label="Minutes to advance"
          />
          <Button
            type="button"
            disabled={busy}
            onClick={() => {
              setBusy(true);
              void withDemoRepo((a) =>
                repo.advanceDemoTime(a, parseInt(minutes, 10) || 0),
              )
                .then(() => toast({ title: "Demo time advanced" }))
                .finally(() => setBusy(false));
            }}
          >
            Advance minutes
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Reset data</CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            type="button"
            variant="destructive"
            disabled={busy}
            onClick={() => {
              setBusy(true);
              void demoResetAll()
                .then(() => toast({ title: "Demo data reset" }))
                .finally(() => setBusy(false));
            }}
          >
            Reset all demo data
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Force-fail operations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {FAIL_OPS.map((op) => (
            <label key={op} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={!!forceFail[op]}
                onChange={(e) => setForceFailOp(op, e.target.checked)}
              />
              {op}
            </label>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
