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
import { StatusBadge } from "@/components/status-badge";
import { CallbackDetailSheet } from "@/components/callbacks/callback-detail-sheet";
import { useDemoReady } from "@/lib/hooks/use-demo-ready";
import { patientName } from "@/lib/display/lookups";
import { formatKarachi } from "@/lib/time";

export default function ReceptionCallbacksStatusPage() {
  const { ready, state } = useDemoReady();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (!ready || !state) {
    return <p className="text-sm text-muted">Loading callback statuses…</p>;
  }

  const live = state.callbacks.find((c) => c.id === selectedId) ?? null;

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Callbacks status</h1>
        <p className="text-sm text-muted">
          View-only · demo fictional data. Assignment and completion are
          Admin-only.
        </p>
      </header>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Patient</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Updated</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {state.callbacks.map((c) => (
            <TableRow key={c.id}>
              <TableCell>
                <button
                  type="button"
                  className="text-primary hover:underline"
                  onClick={() => setSelectedId(c.id)}
                >
                  {patientName(state, c.patientId)}
                </button>
              </TableCell>
              <TableCell>
                <StatusBadge status={c.status} />
              </TableCell>
              <TableCell>{c.phoneE164}</TableCell>
              <TableCell className="tabular-nums text-sm">
                {formatKarachi(c.updatedAt, "dd MMM · hh:mm a")}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <CallbackDetailSheet
        open={!!live}
        onOpenChange={(o) => !o && setSelectedId(null)}
        callback={live}
        state={state}
      />
    </div>
  );
}
