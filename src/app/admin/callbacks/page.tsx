"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
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
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { Panel } from "@/components/layout/panel";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDemoReady } from "@/lib/hooks/use-demo-ready";
import { patientName } from "@/lib/display/lookups";
import { formatKarachi } from "@/lib/time";
import type { CallbackStatus } from "@/lib/types";

const PENDING: CallbackStatus[] = ["pending", "assigned", "in_progress"];

export default function AdminCallbacksPage() {
  const { ready, state } = useDemoReady();
  const searchParams = useSearchParams();
  const paramStatus = searchParams.get("status");
  const resolvedStatus = (() => {
    if (paramStatus === "pending" || paramStatus === "open") return "open";
    if (
      paramStatus === "assigned" ||
      paramStatus === "in_progress" ||
      paramStatus === "completed" ||
      paramStatus === "unable_to_reach" ||
      paramStatus === "all"
    ) {
      return paramStatus;
    }
    return "open";
  })();
  const [statusFilter, setStatusFilter] = useState(resolvedStatus);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    setStatusFilter(resolvedStatus);
  }, [resolvedStatus]);

  const filtered = useMemo(() => {
    if (!state) return [];
    return state.callbacks
      .filter((c) => {
        if (statusFilter === "all") return true;
        if (statusFilter === "open") return PENDING.includes(c.status);
        return c.status === statusFilter;
      })
      .slice()
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [state, statusFilter]);

  if (!ready || !state) {
    return <p className="text-sm text-muted">Loading callbacks…</p>;
  }

  const live = state.callbacks.find((c) => c.id === selectedId) ?? null;

  return (
    <div className="space-y-6">
      <DashboardHeader
        eyebrow="Follow-ups"
        title={
          statusFilter === "open" || statusFilter === "pending"
            ? "Pending callbacks"
            : "Callbacks"
        }
        description="Assign and complete human follow-ups from calls and WhatsApp."
        badge={
          <Badge variant="secondary">
            {filtered.length} shown
          </Badge>
        }
        actions={
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 w-44 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Open (pending queue)</SelectItem>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="assigned">Assigned</SelectItem>
              <SelectItem value="in_progress">In progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="unable_to_reach">Unable to reach</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      <Panel
        title="Callback queue"
        description="Open a patient to update status and notes."
      >
        <div className="overflow-hidden rounded-2xl border border-border/80">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Patient</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted">
                    No callbacks in this filter.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((c) => (
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
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Panel>

      <CallbackDetailSheet
        open={!!live}
        onOpenChange={(o) => !o && setSelectedId(null)}
        callback={live}
        state={state}
      />
    </div>
  );
}
