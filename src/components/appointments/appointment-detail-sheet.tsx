"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { StatusBadge } from "@/components/status-badge";
import { PaymentPanel } from "@/components/payments/payment-panel";
import { formatPkr } from "@/lib/money";
import { formatKarachi } from "@/lib/time";
import {
  bookingRef,
  doctorName,
  patientName,
  serviceName,
} from "@/lib/display/lookups";
import type { Appointment, DemoState } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { RescheduleDialog } from "./reschedule-dialog";
import { CancelDialog } from "./cancel-dialog";

interface AppointmentDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: Appointment | null;
  state: DemoState;
  showPaymentVerify?: boolean;
  showLifecycleActions?: boolean;
  onArrivalUpdate?: (status: Appointment["arrivalStatus"]) => void;
}

export function AppointmentDetailSheet({
  open,
  onOpenChange,
  appointment,
  state,
  showPaymentVerify = true,
  showLifecycleActions = false,
  onArrivalUpdate,
}: AppointmentDetailSheetProps) {
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  if (!appointment) return null;

  const ref = bookingRef(appointment.id);

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="overflow-y-auto pb-8">
          <SheetHeader>
            <SheetTitle>{patientName(state, appointment.patientId)}</SheetTitle>
            <SheetDescription>
              Booking ref {ref} · {doctorName(state, appointment.doctorId)}
            </SheetDescription>
          </SheetHeader>
          <div className="mt-4 space-y-4 px-6">
            <dl className="grid gap-2 text-sm">
              <div>
                <dt className="text-muted">Service</dt>
                <dd>{serviceName(state, appointment.serviceId)}</dd>
              </div>
              <div>
                <dt className="text-muted">Scheduled</dt>
                <dd>
                  {formatKarachi(
                    appointment.scheduledStartIso,
                    "EEE, dd MMM yyyy · hh:mm a",
                  )}{" "}
                  (Karachi)
                </dd>
              </div>
              <div className="flex flex-wrap gap-2">
                <StatusBadge status={appointment.status} />
                <StatusBadge status={appointment.arrivalStatus} />
                <StatusBadge status={appointment.paymentStatus} />
              </div>
              <div>
                <dt className="text-muted">Fee</dt>
                <dd>{formatPkr(appointment.totalFeePaisa)}</dd>
              </div>
              {appointment.notes ? (
                <div>
                  <dt className="text-muted">Notes</dt>
                  <dd className="whitespace-pre-wrap">{appointment.notes}</dd>
                </div>
              ) : null}
            </dl>

            {showLifecycleActions && onArrivalUpdate ? (
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    "arrived",
                    "in_consultation",
                    "completed",
                    "no_show",
                  ] as const
                ).map((s) => (
                  <Button
                    key={s}
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => onArrivalUpdate(s)}
                  >
                    Mark {s.replace("_", " ")}
                  </Button>
                ))}
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => setRescheduleOpen(true)}
              >
                Reschedule
              </Button>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                onClick={() => setCancelOpen(true)}
              >
                Cancel
              </Button>
            </div>

            {showPaymentVerify ? (
              <PaymentPanel
                appointment={appointment}
                payments={state.payments}
              />
            ) : (
              <div className="rounded-lg border border-border p-4 text-sm">
                <p className="font-medium">Payment clearance</p>
                <p className="text-muted">
                  Verified {formatPkr(appointment.verifiedAmountPaisa)} of{" "}
                  {formatPkr(appointment.totalFeePaisa)} —{" "}
                  <StatusBadge status={appointment.paymentStatus} />
                </p>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
      <RescheduleDialog
        open={rescheduleOpen}
        onOpenChange={setRescheduleOpen}
        appointment={appointment}
        state={state}
      />
      <CancelDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        appointment={appointment}
      />
    </>
  );
}
