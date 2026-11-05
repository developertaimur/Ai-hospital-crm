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
export default function ReceptionCallbacksPage() {
  const { ready, state } = useDemoReady();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (!ready || !state) {
    return <p className="text-sm text-muted">Loading…</p>;
  }

  const live = state.callbacks.find((c) => c.id === selectedId) ?? null;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Callbacks</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Patient</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Phone</TableHead>
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
