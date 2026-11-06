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
import { StatusBadge } from "@/components/status-badge";
import { AppointmentDetailSheet } from "./appointment-detail-sheet";
import {
  bookingRef,
  doctorName,
  patientName,
  serviceName,
} from "@/lib/display/lookups";
import { formatKarachi } from "@/lib/time";
import type { Appointment, DemoState } from "@/lib/types";
import { withDemoRepo } from "@/lib/store/demo-store";
import * as repo from "@/lib/mock/repository";
import { useActorUserId } from "@/lib/hooks/use-effective-role";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

interface AppointmentTableProps {
  state: DemoState;
  appointments: Appointment[];
  showDoctor?: boolean;
  showPaymentVerify?: boolean;
  showLifecycleActions?: boolean;
  emptyMessage?: string;
  /** Sync row clicks with an external panel (e.g. awaiting payment). */
  onAppointmentSelect?: (appointmentId: string) => void;
}

export function AppointmentTable({
  state,
  appointments,
  showDoctor = true,
  showPaymentVerify = true,
  showLifecycleActions = false,
  emptyMessage = "No appointments match your filters.",
  onAppointmentSelect,
}: AppointmentTableProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const actorUserId = useActorUserId();

  const sorted = useMemo(
    () =>
      [...appointments].sort((a, b) =>
        a.scheduledStartIso.localeCompare(b.scheduledStartIso),
      ),
    [appointments],
  );

  const selected = useMemo(
    () => state.appointments.find((a) => a.id === selectedId) ?? null,
    [state.appointments, selectedId],
  );

  function openAppointment(aptId: string) {
    setSelectedId(aptId);
    onAppointmentSelect?.(aptId);
  }

  function onRowKeyDown(e: KeyboardEvent<HTMLTableRowElement>, aptId: string) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openAppointment(aptId);
    }
  }

  async function onArrivalUpdate(
    apt: Appointment,
    arrivalStatus: Appointment["arrivalStatus"],
  ) {
    if (!actorUserId) return;
    try {
      await withDemoRepo((adapter) =>
        repo.updateArrivalStatus(adapter, {
          appointmentId: apt.id,
          arrivalStatus,
          actorUserId,
        }),
      );
      toast({ title: `Marked ${arrivalStatus.replace("_", " ")}` });
    } catch (e) {
      toast({
        title: "Update failed",
        description: e instanceof Error ? e.message : undefined,
        variant: "destructive",
      });
    }
  }

  if (sorted.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border bg-surface p-10 text-center text-sm text-muted shadow-sm">
        {emptyMessage}
      </p>
    );
  }

  return (
    <>
      <div className="max-w-full overflow-hidden rounded-2xl border border-border/80 bg-surface shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Patient</TableHead>
              <TableHead>Ref</TableHead>
              {showDoctor ? <TableHead>Doctor</TableHead> : null}
              <TableHead>Service</TableHead>
              <TableHead>When</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead className="w-10">
                <span className="sr-only">Open</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((apt) => {
              const isSelected = selectedId === apt.id;
              return (
                <TableRow
                  key={apt.id}
                  tabIndex={0}
                  role="button"
                  aria-label={`Open details for ${patientName(state, apt.patientId)}, booking ${bookingRef(apt.id)}`}
                  aria-pressed={isSelected}
                  data-state={isSelected ? "selected" : undefined}
                  className={cn(
                    "cursor-pointer outline-none transition-colors hover:bg-primary/[0.04] focus-visible:bg-primary/[0.06] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                    isSelected && "bg-primary/[0.06]",
                  )}
                  onClick={() => openAppointment(apt.id)}
                  onKeyDown={(e) => onRowKeyDown(e, apt.id)}
                >
                  <TableCell className="font-medium text-foreground">
                    {patientName(state, apt.patientId)}
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-xs tracking-wide text-muted">
                      {bookingRef(apt.id)}
                    </span>
                  </TableCell>
                  {showDoctor ? (
                    <TableCell className="text-foreground/90">
                      {doctorName(state, apt.doctorId)}
                    </TableCell>
                  ) : null}
                  <TableCell>{serviceName(state, apt.serviceId)}</TableCell>
                  <TableCell className="whitespace-nowrap tabular-nums">
                    {formatKarachi(apt.scheduledStartIso, "hh:mm a")}
                    <span className="ml-1 text-xs text-muted">
                      {formatKarachi(apt.scheduledStartIso, "dd MMM")}
                    </span>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={apt.status} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={apt.paymentStatus} />
                  </TableCell>
                  <TableCell className="text-muted">
                    <ChevronRight className="size-4" aria-hidden />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <AppointmentDetailSheet
        open={!!selected}
        onOpenChange={(o) => !o && setSelectedId(null)}
        appointment={selected}
        state={state}
        showPaymentVerify={showPaymentVerify}
        showLifecycleActions={showLifecycleActions}
        onArrivalUpdate={
          selected
            ? (s) => void onArrivalUpdate(selected, s)
            : undefined
        }
      />
    </>
  );
}
