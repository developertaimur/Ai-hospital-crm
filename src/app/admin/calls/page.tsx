"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useDemoReady } from "@/lib/hooks/use-demo-ready";
import { formatKarachi } from "@/lib/time";
import { patientName } from "@/lib/display/lookups";
import type { CallRecord } from "@/lib/types";

export default function AdminCallsPage() {
  const { ready, state } = useDemoReady();
  const [selected, setSelected] = useState<CallRecord | null>(null);

  if (!ready || !state) {
    return <p className="text-sm text-muted">Loading calls…</p>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Calls</h1>
      <p className="text-sm text-muted">Simulated call records from demo seed.</p>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Direction</TableHead>
            <TableHead>Patient</TableHead>
            <TableHead>Started</TableHead>
            <TableHead>Language</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Transfer</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {state.callRecords.map((c) => (
            <TableRow key={c.id}>
              <TableCell>
                <button
                  type="button"
                  className="capitalize text-primary hover:underline"
                  onClick={() => setSelected(c)}
                >
                  {c.direction}
                </button>
              </TableCell>
              <TableCell>
                {c.patientId ? patientName(state, c.patientId) : "—"}
              </TableCell>
              <TableCell>
                {formatKarachi(c.startedAt, "dd MMM yyyy · hh:mm a")}
              </TableCell>
              <TableCell>{c.language?.toUpperCase() ?? "—"}</TableCell>
              <TableCell>
                {c.durationSeconds != null
                  ? `${Math.round(c.durationSeconds / 60)} min`
                  : "—"}
              </TableCell>
              <TableCell>{c.transferOutcome?.replace("_", " ") ?? "—"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Call detail</SheetTitle>
          </SheetHeader>
          {selected ? (
            <dl className="mt-4 space-y-2 px-6 text-sm">
              <div>
                <dt className="text-muted">ID</dt>
                <dd>{selected.id}</dd>
              </div>
              <div>
                <dt className="text-muted">Language</dt>
                <dd>{selected.language?.toUpperCase() ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted">Duration</dt>
                <dd>
                  {selected.durationSeconds != null
                    ? `${selected.durationSeconds} seconds`
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-muted">Summary</dt>
                <dd className="whitespace-pre-wrap">
                  {selected.summary ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-muted">Ended</dt>
                <dd>
                  {selected.endedAt
                    ? formatKarachi(selected.endedAt, "dd MMM yyyy · hh:mm a")
                    : "—"}
                </dd>
              </div>
            </dl>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
