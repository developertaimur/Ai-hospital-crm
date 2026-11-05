"use client";

import { useMemo, useState } from "react";
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
  const selected = useMemo(
    () => appointments.find((a) => a.id === selectedId) ?? null,
    [appointments, selectedId],
  );

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

  if (appointments.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted">
        {emptyMessage}
      </p>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Patient</TableHead>
            <TableHead>Ref</TableHead>
            {showDoctor ? <TableHead>Doctor</TableHead> : null}
            <TableHead>Service</TableHead>
            <TableHead>When</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Payment</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {appointments.map((apt) => (
            <TableRow key={apt.id}>
              <TableCell>
                <button
                  type="button"
                  className="font-medium text-primary underline-offset-2 hover:underline"
                  onClick={() => {
                    setSelectedId(apt.id);
                    onAppointmentSelect?.(apt.id);
                  }}
                >
                  {patientName(state, apt.patientId)}
                </button>
              </TableCell>
              <TableCell>
                <button
                  type="button"
                  className="text-muted underline-offset-2 hover:text-foreground hover:underline"
                  onClick={() => {
                    setSelectedId(apt.id);
                    onAppointmentSelect?.(apt.id);
                  }}
                >
                  {bookingRef(apt.id)}
                </button>
              </TableCell>
              {showDoctor ? (
                <TableCell>{doctorName(state, apt.doctorId)}</TableCell>
              ) : null}
              <TableCell>{serviceName(state, apt.serviceId)}</TableCell>
              <TableCell>
                {formatKarachi(apt.scheduledStartIso, "dd MMM · hh:mm a")}
              </TableCell>
              <TableCell>
                <StatusBadge status={apt.status} />
              </TableCell>
              <TableCell>
                <StatusBadge status={apt.paymentStatus} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

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
