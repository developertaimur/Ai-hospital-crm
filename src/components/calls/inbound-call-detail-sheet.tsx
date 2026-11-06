"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { StatusBadge } from "@/components/status-badge";
import {
  bookingOutcomeLabel,
  bookingRef,
  callerDisplayName,
  callerDisplayNumber,
  doctorName,
  findCallbackForAppointment,
  formatCallDuration,
  getPatient,
  serviceName,
  userDisplayName,
} from "@/lib/display/lookups";
import { formatPkr } from "@/lib/money";
import { formatKarachi } from "@/lib/time";
import type { CallRecord, DemoState } from "@/lib/types";
import {
  Bot,
  CalendarClock,
  Forward,
  MessagesSquare,
  Phone,
  Stethoscope,
  UserRound,
} from "lucide-react";

interface InboundCallDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  call: CallRecord | null;
  state: DemoState;
}

export function InboundCallDetailSheet({
  open,
  onOpenChange,
  call,
  state,
}: InboundCallDetailSheetProps) {
  if (!call) return null;

  const patient = call.patientId
    ? getPatient(state, call.patientId)
    : undefined;
  const appointment = call.appointmentId
    ? state.appointments.find((a) => a.id === call.appointmentId)
    : undefined;
  const callback = call.appointmentId
    ? findCallbackForAppointment(state, call.appointmentId)
    : state.callbacks.find(
        (c) =>
          !!call.patientId &&
          c.patientId === call.patientId &&
          (c.status === "pending" ||
            c.status === "assigned" ||
            c.status === "in_progress"),
      );
  const requestedDoctorId =
    call.requestedDoctorId ?? appointment?.doctorId ?? callback?.requestedDoctorId;
  const requestedServiceId =
    call.requestedServiceId ?? appointment?.serviceId;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-hidden p-0">
        <SheetHeader>
          <SheetTitle className="pr-2">
            {callerDisplayName(state, call)}
          </SheetTitle>
          <SheetDescription>
            Incoming AI call · demo fictional data · {call.id}
          </SheetDescription>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {bookingOutcomeLabel(call.bookingOutcome)}
            </span>
            {call.forwardedToAdmin ? (
              <span className="rounded-md bg-warning/15 px-2 py-0.5 text-xs font-medium text-warning">
                Forwarded to Admin
              </span>
            ) : null}
            {appointment ? <StatusBadge status={appointment.status} /> : null}
            {appointment ? (
              <StatusBadge status={appointment.paymentStatus} />
            ) : null}
          </div>
        </SheetHeader>

        <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
          <section className="rounded-xl border border-border bg-background/60 p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-foreground">
              Patient / caller details
            </h3>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div className="flex gap-2">
                <UserRound
                  className="mt-0.5 size-4 shrink-0 text-primary"
                  aria-hidden
                />
                <div>
                  <dt className="text-muted">Name</dt>
                  <dd className="font-medium">
                    {patient?.fullName ?? call.callerName ?? "Unknown caller"}
                  </dd>
                </div>
              </div>
              <div className="flex gap-2">
                <Phone
                  className="mt-0.5 size-4 shrink-0 text-primary"
                  aria-hidden
                />
                <div>
                  <dt className="text-muted">Number</dt>
                  <dd>{callerDisplayNumber(state, call)}</dd>
                </div>
              </div>
              <div>
                <dt className="text-muted">Call date / time</dt>
                <dd>
                  {formatKarachi(call.startedAt, "EEE, dd MMM yyyy · hh:mm a")}{" "}
                  <span className="text-muted">(Asia/Karachi)</span>
                </dd>
              </div>
              <div>
                <dt className="text-muted">Duration / language</dt>
                <dd>
                  {formatCallDuration(call.durationSeconds)} ·{" "}
                  {call.language === "ur"
                    ? "Urdu"
                    : call.language === "en"
                      ? "English"
                      : "—"}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-xl border border-border bg-surface p-4 shadow-sm">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
              <MessagesSquare className="size-4 text-primary" aria-hidden />
              Patient / AI conversation transcript
            </h3>
            <p className="mb-3 text-xs text-muted">
              Simulated demo transcript — not a clinical record.
            </p>
            <div className="space-y-3 text-sm">
              <div className="rounded-lg border border-border bg-background p-3">
                <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
                  <UserRound className="size-3.5" aria-hidden />
                  Patient
                </p>
                <p className="whitespace-pre-wrap">
                  {call.patientTranscript ?? "Transcript unavailable"}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-background p-3">
                <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
                  <Bot className="size-3.5" aria-hidden />
                  AI receptionist
                </p>
                <p className="whitespace-pre-wrap">
                  {call.aiTranscript ?? "Transcript unavailable"}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-border bg-surface p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-foreground">
              Call summary
            </h3>
            <p className="whitespace-pre-wrap rounded-lg bg-background p-3 text-sm">
              {call.summary ?? "Summary unavailable"}
            </p>
          </section>

          <section className="rounded-xl border border-border bg-background/60 p-4 shadow-sm">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
              <Stethoscope className="size-4 text-primary" aria-hidden />
              Requested doctor / service
            </h3>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted">Doctor</dt>
                <dd>
                  {requestedDoctorId
                    ? doctorName(state, requestedDoctorId)
                    : "Not specified"}
                </dd>
              </div>
              <div>
                <dt className="text-muted">Service</dt>
                <dd>
                  {requestedServiceId
                    ? serviceName(state, requestedServiceId)
                    : "Not specified"}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-xl border border-border bg-surface p-4 shadow-sm">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
              <CalendarClock className="size-4 text-primary" aria-hidden />
              Provisional booking details
            </h3>
            {appointment ? (
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-muted">Booking reference</dt>
                  <dd className="font-mono text-xs font-semibold tracking-wide">
                    {bookingRef(appointment.id)}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted">When</dt>
                  <dd>
                    {formatKarachi(
                      appointment.scheduledStartIso,
                      "EEE, dd MMM yyyy · hh:mm a",
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted">Booking status</dt>
                  <dd>
                    <StatusBadge status={appointment.status} />
                  </dd>
                </div>
                <div>
                  <dt className="text-muted">Payment status</dt>
                  <dd>
                    <StatusBadge status={appointment.paymentStatus} />
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-muted">Fee / verified</dt>
                  <dd>
                    {formatPkr(appointment.totalFeePaisa)} total · verified{" "}
                    {formatPkr(appointment.verifiedAmountPaisa)}
                  </dd>
                </div>
                <p className="sm:col-span-2 text-xs text-muted">
                  Reception can view these statuses only. Confirm, cancel,
                  reschedule, and payment verification are Admin-only.
                </p>
              </dl>
            ) : (
              <p className="rounded-lg border border-dashed border-border bg-background px-3 py-4 text-sm text-muted">
                No provisional booking linked to this call (demo).
              </p>
            )}
          </section>

          <section className="rounded-xl border border-border bg-surface p-4 shadow-sm">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
              <Forward className="size-4 text-primary" aria-hidden />
              Callback / Admin forward
            </h3>
            {callback ? (
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="text-muted">Reason</dt>
                  <dd>{callback.reason}</dd>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <dt className="text-muted">Request status</dt>
                  <dd>
                    <StatusBadge status={callback.status} />
                  </dd>
                </div>
                <div>
                  <dt className="text-muted">Preferred window</dt>
                  <dd>{callback.preferredWindow ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted">Assigned (Admin queue)</dt>
                  <dd>
                    {callback.assignedToUserId
                      ? userDisplayName(state, callback.assignedToUserId)
                      : "Unassigned — forwarded for Admin handling"}
                  </dd>
                </div>
                {callback.summary ? (
                  <div>
                    <dt className="text-muted">Callback summary</dt>
                    <dd className="whitespace-pre-wrap">{callback.summary}</dd>
                  </div>
                ) : null}
                <p className="text-xs text-muted">
                  Callback status is view-only for Reception. Admin manages
                  assignment and completion.
                </p>
              </dl>
            ) : call.forwardedToAdmin ? (
              <p className="text-sm text-muted">
                Call marked forwarded to Admin. No separate callback record in
                demo seed.
              </p>
            ) : (
              <p className="text-sm text-muted">
                No callback information for this call.
              </p>
            )}
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
