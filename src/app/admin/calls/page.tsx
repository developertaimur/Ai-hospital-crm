"use client";

import { useMemo, useState, type KeyboardEvent } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { InboundCallDetailSheet } from "@/components/calls/inbound-call-detail-sheet";
import { useDemoReady } from "@/lib/hooks/use-demo-ready";
import {
  bookingOutcomeLabel,
  callerDisplayName,
  callerDisplayNumber,
  formatCallDuration,
} from "@/lib/display/lookups";
import { formatKarachi } from "@/lib/time";
import type { CallRecord } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function AdminCallsPage() {
  const { ready, state } = useDemoReady();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const calls = useMemo(() => {
    if (!state) return [];
    return [...state.callRecords].sort((a, b) =>
      b.startedAt.localeCompare(a.startedAt),
    );
  }, [state]);

  const selected: CallRecord | null = useMemo(() => {
    if (!state || !selectedId) return null;
    return state.callRecords.find((c) => c.id === selectedId) ?? null;
  }, [state, selectedId]);

  function onRowKeyDown(e: KeyboardEvent<HTMLTableRowElement>, id: string) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setSelectedId(id);
    }
  }

  if (!ready || !state) {
    return <p className="text-sm text-muted">Loading calls…</p>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold sm:text-2xl">Calls</h1>
      <p className="text-sm text-muted">
        Simulated call records from demo seed ({calls.length} total).
      </p>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Direction</TableHead>
            <TableHead>Caller</TableHead>
            <TableHead>Number</TableHead>
            <TableHead>Started</TableHead>
            <TableHead>Language</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Outcome</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {calls.map((c) => {
            const isSelected = selectedId === c.id;
            return (
              <TableRow
                key={c.id}
                tabIndex={0}
                role="button"
                aria-pressed={isSelected}
                className={cn(
                  "cursor-pointer outline-none hover:bg-primary/[0.04] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                  isSelected && "bg-primary/[0.06]",
                )}
                onClick={() => setSelectedId(c.id)}
                onKeyDown={(e) => onRowKeyDown(e, c.id)}
              >
                <TableCell className="capitalize text-primary">
                  {c.direction}
                </TableCell>
                <TableCell>{callerDisplayName(state, c)}</TableCell>
                <TableCell className="tabular-nums">
                  {callerDisplayNumber(state, c)}
                </TableCell>
                <TableCell>
                  {formatKarachi(c.startedAt, "dd MMM yyyy · hh:mm a")}
                </TableCell>
                <TableCell>{c.language?.toUpperCase() ?? "—"}</TableCell>
                <TableCell>
                  {formatCallDuration(c.durationSeconds)}
                </TableCell>
                <TableCell>
                  {bookingOutcomeLabel(c.bookingOutcome)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <InboundCallDetailSheet
        open={!!selected}
        onOpenChange={(o) => !o && setSelectedId(null)}
        call={selected}
        state={state}
      />
    </div>
  );
}
