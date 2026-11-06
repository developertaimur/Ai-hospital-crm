"use client";

import { useEffect, useId, useRef, useState } from "react";
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
  findCallForAppointment,
  findCallbackForAppointment,
  formatCallDuration,
  getPatient,
  serviceName,
  userDisplayName,
} from "@/lib/display/lookups";
import type { Appointment, DemoState } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RescheduleDialog } from "./reschedule-dialog";
import { CancelDialog } from "./cancel-dialog";
import {
  getPermissionsForUser,
  hasPermission,
} from "@/lib/auth/demo-accounts";
import { useActorUserId } from "@/lib/hooks/use-effective-role";
import { withDemoRepo } from "@/lib/store/demo-store";
import * as repo from "@/lib/mock/repository";
import { toast } from "@/components/ui/use-toast";
import {
  Banknote,
  CalendarClock,
  FileText,
  Mail,
  NotebookPen,
  Phone,
  PhoneCall,
  Stethoscope,
  UserRound,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
  const actorUserId = useActorUserId();
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");
  const [noteBusy, setNoteBusy] = useState(false);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const bookingSectionRef = useRef<HTMLElement | null>(null);
  const paymentSectionRef = useRef<HTMLElement | null>(null);
  const noteInputRef = useRef<HTMLTextAreaElement | null>(null);
  const noteFieldId = useId();

  const liveAppointment = appointment
    ? (state.appointments.find((a) => a.id === appointment.id) ?? appointment)
    : null;

  useEffect(() => {
    if (showNoteForm) {
      noteInputRef.current?.focus();
    }
  }, [showNoteForm]);

  function handleOpenChange(next: boolean) {
    if (!next) {
      setShowNoteForm(false);
      setNoteDraft("");
    }
    onOpenChange(next);
  }

  if (!liveAppointment) return null;

  const patient = getPatient(state, liveAppointment.patientId);
  const ref = bookingRef(liveAppointment.id);
  const balance =
    liveAppointment.totalFeePaisa - liveAppointment.verifiedAmountPaisa;
  const call = findCallForAppointment(state, liveAppointment.id);
  const callback = findCallbackForAppointment(state, liveAppointment.id);
  const actorPerms = actorUserId
    ? getPermissionsForUser(actorUserId)
    : [];
  const canVerify =
    !!actorUserId && hasPermission(actorPerms, "verify_payment");
  const canManageAppointments =
    !!actorUserId && hasPermission(actorPerms, "manage_appointments");
  const allowPaymentVerify = showPaymentVerify && canVerify;
  const allowLifecycle =
    showLifecycleActions &&
    !!onArrivalUpdate &&
    !!actorUserId &&
    hasPermission(actorPerms, "update_arrival");

  async function onAddNote() {
    if (!actorUserId || noteBusy || !liveAppointment) return;
    setNoteBusy(true);
    try {
      await withDemoRepo((adapter) =>
        repo.addAppointmentNote(
          adapter,
          liveAppointment.id,
          actorUserId,
          noteDraft,
        ),
      );
      toast({ title: "Note added" });
      setNoteDraft("");
      setShowNoteForm(false);
    } catch (e) {
      toast({
        title: "Could not add note",
        description: e instanceof Error ? e.message : undefined,
        variant: "destructive",
      });
    } finally {
      setNoteBusy(false);
    }
  }

  function scrollTo(el: HTMLElement | null) {
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <>
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent className="overflow-hidden p-0">
          <SheetHeader>
            <SheetTitle className="pr-2">
              {patient?.fullName ?? "Patient"}
            </SheetTitle>
            <SheetDescription>
              Booking {ref} · {doctorName(state, liveAppointment.doctorId)}
            </SheetDescription>
            <div className="mt-3 flex flex-wrap gap-2">
              <StatusBadge status={liveAppointment.status} />
              <StatusBadge status={liveAppointment.paymentStatus} />
              <StatusBadge status={liveAppointment.arrivalStatus} />
            </div>
          </SheetHeader>

          <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => scrollTo(bookingSectionRef.current)}
              >
                <FileText className="size-3.5" aria-hidden />
                View booking
              </Button>
              {allowPaymentVerify ? (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    scrollTo(paymentSectionRef.current);
                  }}
                >
                  <Banknote className="size-3.5" aria-hidden />
                  Verify payment
                </Button>
              ) : null}
              {canManageAppointments ? (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => setShowNoteForm(true)}
                >
                  <NotebookPen className="size-3.5" aria-hidden />
                  Add note
                </Button>
              ) : null}
            </div>

            <section
              ref={bookingSectionRef}
              aria-labelledby="booking-details-heading"
              className="rounded-xl border border-border bg-background/60 p-4 shadow-sm"
            >
              <h3
                id="booking-details-heading"
                className="mb-3 text-sm font-semibold text-foreground"
              >
                Booking details
              </h3>
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div className="flex gap-2">
                  <UserRound
                    className="mt-0.5 size-4 shrink-0 text-primary"
                    aria-hidden
                  />
                  <div>
                    <dt className="text-muted">Patient</dt>
                    <dd className="font-medium">{patient?.fullName ?? "—"}</dd>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Phone
                    className="mt-0.5 size-4 shrink-0 text-primary"
                    aria-hidden
                  />
                  <div>
                    <dt className="text-muted">Phone</dt>
                    <dd>{patient?.phoneNational ?? patient?.phoneE164 ?? "—"}</dd>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Mail
                    className="mt-0.5 size-4 shrink-0 text-primary"
                    aria-hidden
                  />
                  <div>
                    <dt className="text-muted">Email</dt>
                    <dd>{patient?.email ?? "Not provided"}</dd>
                  </div>
                </div>
                <div className="flex gap-2">
                  <FileText
                    className="mt-0.5 size-4 shrink-0 text-primary"
                    aria-hidden
                  />
                  <div>
                    <dt className="text-muted">Booking reference</dt>
                    <dd className="font-mono text-xs font-semibold tracking-wide">
                      {ref}
                    </dd>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Stethoscope
                    className="mt-0.5 size-4 shrink-0 text-primary"
                    aria-hidden
                  />
                  <div>
                    <dt className="text-muted">Doctor / service</dt>
                    <dd>
                      {doctorName(state, liveAppointment.doctorId)}
                      <span className="text-muted"> · </span>
                      {serviceName(state, liveAppointment.serviceId)}
                    </dd>
                  </div>
                </div>
                <div className="flex gap-2">
                  <CalendarClock
                    className="mt-0.5 size-4 shrink-0 text-primary"
                    aria-hidden
                  />
                  <div>
                    <dt className="text-muted">Appointment time</dt>
                    <dd>
                      {formatKarachi(
                        liveAppointment.scheduledStartIso,
                        "EEE, dd MMM yyyy · hh:mm a",
                      )}{" "}
                      <span className="text-muted">(Asia/Karachi)</span>
                    </dd>
                  </div>
                </div>
                <div className="flex gap-2 sm:col-span-2">
                  <Banknote
                    className="mt-0.5 size-4 shrink-0 text-primary"
                    aria-hidden
                  />
                  <div>
                    <dt className="text-muted">Fee / remaining balance</dt>
                    <dd>
                      {formatPkr(liveAppointment.totalFeePaisa)} total · verified{" "}
                      {formatPkr(liveAppointment.verifiedAmountPaisa)}
                      {balance > 0 ? (
                        <>
                          {" "}
                          ·{" "}
                          <span className="font-medium text-warning">
                            {formatPkr(balance)} remaining
                          </span>
                        </>
                      ) : (
                        <>
                          {" "}
                          ·{" "}
                          <span className="font-medium text-success">
                            Balance cleared
                          </span>
                        </>
                      )}
                    </dd>
                  </div>
                </div>
              </dl>
            </section>

            <section
              aria-labelledby="ai-call-heading"
              className="rounded-xl border border-border bg-surface p-4 shadow-sm"
            >
              <h3
                id="ai-call-heading"
                className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground"
              >
                <PhoneCall className="size-4 text-primary" aria-hidden />
                Linked AI call summary
              </h3>
              {call ? (
                <dl className="space-y-3 text-sm">
                  <div>
                    <dt className="text-muted">Call date / time</dt>
                    <dd>
                      {formatKarachi(
                        call.startedAt,
                        "EEE, dd MMM yyyy · hh:mm a",
                      )}{" "}
                      (Asia/Karachi)
                    </dd>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <dt className="text-muted">Duration</dt>
                      <dd>
                        {formatCallDuration(
                          call.durationSeconds ??
                            (call.endedAt
                              ? (Date.parse(call.endedAt) -
                                  Date.parse(call.startedAt)) /
                                1000
                              : undefined),
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted">Language</dt>
                      <dd>
                        {call.language === "ur"
                          ? "Urdu"
                          : call.language === "en"
                            ? "English"
                            : "—"}
                      </dd>
                    </div>
                  </div>
                  <div>
                    <dt className="text-muted">Conversation summary</dt>
                    <dd className="mt-1 whitespace-pre-wrap rounded-lg bg-background p-3 text-foreground">
                      {call.summary ?? "Summary unavailable"}
                    </dd>
                  </div>
                  {call.patientTranscript || call.aiTranscript ? (
                    <div className="space-y-2 border-t border-border pt-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                        Patient / AI transcript (demo)
                      </p>
                      {call.patientTranscript ? (
                        <p className="whitespace-pre-wrap rounded-lg bg-background p-3 text-sm">
                          <span className="font-medium">Patient: </span>
                          {call.patientTranscript}
                        </p>
                      ) : null}
                      {call.aiTranscript ? (
                        <p className="whitespace-pre-wrap rounded-lg bg-background p-3 text-sm">
                          <span className="font-medium">AI: </span>
                          {call.aiTranscript}
                        </p>
                      ) : null}
                    </div>
                  ) : (
                    <p className="text-xs text-muted">
                      Matched by call ID {call.id} → appointment{" "}
                      {liveAppointment.id}.
                    </p>
                  )}
                </dl>
              ) : (
                <p className="rounded-lg border border-dashed border-border bg-background px-3 py-4 text-sm text-muted">
                  No call summary available.
                </p>
              )}

              <div className="mt-4 border-t border-border pt-4">
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                  Callback context
                </h4>
                {callback ? (
                  <dl className="space-y-2 text-sm">
                    <div>
                      <dt className="text-muted">Callback reason</dt>
                      <dd>{callback.reason}</dd>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <dt className="text-muted">Status</dt>
                      <dd>
                        <StatusBadge status={callback.status} />
                      </dd>
                    </div>
                    {callback.assignedToUserId ? (
                      <div>
                        <dt className="text-muted">Assigned staff</dt>
                        <dd>
                          {userDisplayName(state, callback.assignedToUserId)}
                        </dd>
                      </div>
                    ) : null}
                  </dl>
                ) : (
                  <p className="text-sm text-muted">
                    No callback linked to this booking ID.
                  </p>
                )}
              </div>
            </section>

            <section
              aria-labelledby="staff-notes-heading"
              className="rounded-xl border border-border bg-surface p-4 shadow-sm"
            >
              <h3
                id="staff-notes-heading"
                className="mb-3 text-sm font-semibold text-foreground"
              >
                Staff notes
              </h3>
              {liveAppointment.notes ? (
                <pre className="whitespace-pre-wrap rounded-lg bg-background p-3 font-sans text-sm text-foreground">
                  {liveAppointment.notes}
                </pre>
              ) : (
                <p className="text-sm text-muted">No staff notes yet.</p>
              )}
              {callback?.notes?.length ? (
                <div className="mt-3 space-y-2 border-t border-border pt-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                    Linked callback notes
                  </p>
                  {callback.notes.map((n) => (
                    <div
                      key={n.id}
                      className="rounded-lg bg-background p-3 text-sm"
                    >
                      <p className="text-xs text-muted">
                        {userDisplayName(state, n.authorUserId)} ·{" "}
                        {formatKarachi(n.createdAt, "dd MMM · hh:mm a")}
                      </p>
                      <p className="mt-1 whitespace-pre-wrap">{n.body}</p>
                    </div>
                  ))}
                </div>
              ) : null}

              {canManageAppointments && showNoteForm ? (
                <div className="mt-4 space-y-2">
                  <Label htmlFor={noteFieldId}>Add note</Label>
                  <Textarea
                    id={noteFieldId}
                    ref={noteInputRef}
                    value={noteDraft}
                    onChange={(e) => setNoteDraft(e.target.value)}
                    rows={3}
                    placeholder="Staff note (demo — fictional data only)"
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      disabled={noteBusy || !noteDraft.trim()}
                      onClick={() => void onAddNote()}
                    >
                      {noteBusy ? "Saving…" : "Save note"}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      disabled={noteBusy}
                      onClick={() => {
                        setShowNoteForm(false);
                        setNoteDraft("");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : null}
            </section>

            {allowLifecycle ? (
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
                    onClick={() => onArrivalUpdate?.(s)}
                  >
                    Mark {s.replace("_", " ")}
                  </Button>
                ))}
              </div>
            ) : null}

            {canManageAppointments ? (
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
                  Cancel booking
                </Button>
              </div>
            ) : (
              <p className="rounded-lg border border-dashed border-border bg-background px-3 py-3 text-xs text-muted">
                Confirm, cancel, and reschedule are Admin-only. Statuses above
                are view-only for this role.
              </p>
            )}

            <section
              ref={paymentSectionRef}
              aria-labelledby="payment-heading"
              className={cn("scroll-mt-4")}
            >
              <h3
                id="payment-heading"
                className="mb-3 text-sm font-semibold text-foreground"
              >
                Payment
              </h3>
              {allowPaymentVerify ? (
                <PaymentPanel
                  appointment={liveAppointment}
                  payments={state.payments}
                />
              ) : (
                <div className="rounded-xl border border-border bg-background p-4 text-sm shadow-sm">
                  <p className="font-medium">Payment clearance</p>
                  <p className="mt-1 text-muted">
                    Verified {formatPkr(liveAppointment.verifiedAmountPaisa)} of{" "}
                    {formatPkr(liveAppointment.totalFeePaisa)} —{" "}
                    <StatusBadge status={liveAppointment.paymentStatus} />
                  </p>
                  {!canVerify ? (
                    <p className="mt-2 text-xs text-muted">
                      Payment verification is Admin-only.
                    </p>
                  ) : null}
                </div>
              )}
            </section>
          </div>
        </SheetContent>
      </Sheet>
      {canManageAppointments ? (
        <>
          <RescheduleDialog
            open={rescheduleOpen}
            onOpenChange={setRescheduleOpen}
            appointment={liveAppointment}
            state={state}
          />
          <CancelDialog
            open={cancelOpen}
            onOpenChange={setCancelOpen}
            appointment={liveAppointment}
          />
        </>
      ) : null}
    </>
  );
}
