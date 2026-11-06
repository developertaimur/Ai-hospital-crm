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
export default function AdminCallbacksPage() {
  const { ready, state } = useDemoReady();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (!ready || !state) {
    return <p className="text-sm text-muted">Loading callbacks…</p>;
  }

  const live =
    state.callbacks.find((c) => c.id === selectedId) ?? null;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold sm:text-2xl">Callbacks</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Patient</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {state.callbacks.map((c) => (
            <TableRow key={c.id}>
              <TableCell>
                <button
                  type="button"
                  className="font-medium text-primary hover:underline"
                  onClick={() => setSelectedId(c.id)}
                >
                  {patientName(state, c.patientId)}
                </button>
              </TableCell>
              <TableCell className="max-w-xs truncate">{c.reason}</TableCell>
              <TableCell>
                <StatusBadge status={c.status} />
              </TableCell>
              <TableCell>
                {formatKarachi(c.createdAt, "dd MMM · hh:mm a")}
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
