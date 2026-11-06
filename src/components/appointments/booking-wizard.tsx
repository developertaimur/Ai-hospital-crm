"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { withDemoRepo } from "@/lib/store/demo-store";
import * as repo from "@/lib/mock/repository";
import { formatKarachi, getDemoNow, toKarachiDateKey } from "@/lib/time";
import { formatPkr } from "@/lib/money";
import type { DemoState, Patient } from "@/lib/types";
import { doctorName, serviceName } from "@/lib/display/lookups";
import { useActorUserId } from "@/lib/hooks/use-effective-role";
import { id } from "@/lib/utils";

const STEPS = [
  "Doctor",
  "Service",
  "Date",
  "Slot",
  "Patient",
  "Review",
] as const;

interface BookingWizardProps {
  state: DemoState;
  onComplete?: (appointmentId: string) => void;
}

export function BookingWizard({ state, onComplete }: BookingWizardProps) {
  const actorUserId = useActorUserId();
  const activeDoctors = state.doctors.filter((d) => d.active !== false);
  const [step, setStep] = useState(0);
  const [doctorId, setDoctorId] = useState(activeDoctors[0]?.id ?? "");
  const [serviceId, setServiceId] = useState("");
  const [dateKey, setDateKey] = useState(toKarachiDateKey(getDemoNow().toISOString()));
  const [slots, setSlots] = useState<string[]>([]);
  const [slot, setSlot] = useState("");
  const [patientMode, setPatientMode] = useState<"existing" | "new">("existing");
  const [patientId, setPatientId] = useState(state.patients[0]?.id ?? "");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const services = state.doctorServices.filter((ds) => ds.doctorId === doctorId);
  const effectiveServiceId = services.some((s) => s.serviceId === serviceId)
    ? serviceId
    : (services[0]?.serviceId ?? "");
  const ds = services.find((s) => s.serviceId === effectiveServiceId);

  useEffect(() => {
    if (step < 3 || !doctorId || !effectiveServiceId) return;
    let cancelled = false;
    void withDemoRepo((adapter) =>
      repo.getAvailableSlots(adapter, {
        doctorId,
        serviceId: effectiveServiceId,
        dateKey,
      }),
    ).then((s) => {
      if (!cancelled) {
        setSlots(s);
        setSlot(s[0] ?? "");
      }
    });
    return () => {
      cancelled = true;
    };
  }, [step, doctorId, effectiveServiceId, dateKey]);

  const dates = Array.from({ length: 21 }, (_, i) => {
    const base = getDemoNow();
    base.setDate(base.getDate() + i);
    return toKarachiDateKey(base.toISOString());
  });

  async function confirm() {
    if (busy || !slot || !doctorId || !effectiveServiceId) return;
    setBusy(true);
    try {
      let pid = patientId;
      if (patientMode === "new") {
        const created = await withDemoRepo((adapter) =>
          repo.createPatient(adapter, { fullName, phone, email: email || undefined }),
        );
        pid = created.id;
      }
      const apt = await withDemoRepo((adapter) =>
        repo.createReservation(adapter, {
          patientId: pid,
          doctorId,
          serviceId: effectiveServiceId,
          scheduledStartIso: slot,
          actorUserId,
          clientRequestId: id("req"),
          locale: "en",
        }),
      );
      toast({
        title: "Reservation created",
        description: "Awaiting payment verification (simulated SMS queued).",
      });
      onComplete?.(apt.id);
      setStep(0);
    } catch (e) {
      toast({
        title: "Booking failed",
        description: e instanceof Error ? e.message : undefined,
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>New appointment</CardTitle>
        <p className="text-sm text-muted">
          Step {step + 1} of {STEPS.length}: {STEPS[step]}
        </p>
        <ol className="flex flex-wrap gap-1 text-xs text-muted" aria-label="Progress">
          {STEPS.map((s, i) => (
            <li
              key={s}
              className={
                i === step ? "font-semibold text-primary" : i < step ? "text-foreground" : ""
              }
            >
              {s}
              {i < STEPS.length - 1 ? " →" : ""}
            </li>
          ))}
        </ol>
      </CardHeader>
      <CardContent className="space-y-4">
        {step === 0 ? (
          <div className="space-y-2">
            <Label htmlFor="bw-doctor">Doctor</Label>
            <Select
              value={doctorId}
              onValueChange={(id) => {
                setDoctorId(id);
                setServiceId("");
              }}
            >
              <SelectTrigger id="bw-doctor">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {activeDoctors.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="space-y-2">
            <Label htmlFor="bw-service">Service</Label>
            <Select value={effectiveServiceId} onValueChange={setServiceId}>
              <SelectTrigger id="bw-service">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {services.map((s) => (
                  <SelectItem key={s.serviceId} value={s.serviceId}>
                    {serviceName(state, s.serviceId)} · {formatPkr(s.feePaisa)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-2">
            <Label htmlFor="bw-date">Date (Karachi)</Label>
            <Select value={dateKey} onValueChange={setDateKey}>
              <SelectTrigger id="bw-date">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {dates.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-2">
            <Label htmlFor="bw-slot">Available slots</Label>
            {slots.length === 0 ? (
              <p className="text-sm text-muted">No slots on this date.</p>
            ) : (
              <Select value={slot} onValueChange={setSlot}>
                <SelectTrigger id="bw-slot">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {slots.map((s) => (
                    <SelectItem key={s} value={s}>
                      {formatKarachi(s, "hh:mm a")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        ) : null}

        {step === 4 ? (
          <div className="space-y-3">
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant={patientMode === "existing" ? "default" : "secondary"}
                onClick={() => setPatientMode("existing")}
              >
                Existing patient
              </Button>
              <Button
                type="button"
                size="sm"
                variant={patientMode === "new" ? "default" : "secondary"}
                onClick={() => setPatientMode("new")}
              >
                New patient
              </Button>
            </div>
            {patientMode === "existing" ? (
              <div className="space-y-2">
                <Label htmlFor="bw-patient">Patient</Label>
                <Select value={patientId} onValueChange={setPatientId}>
                  <SelectTrigger id="bw-patient">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {state.patients.map((p: Patient) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.fullName} · {p.phoneNational}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <>
                <div className="space-y-1">
                  <Label htmlFor="bw-name">Full name</Label>
                  <Input id="bw-name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="bw-phone">Mobile (PK)</Label>
                  <Input id="bw-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="bw-email">Email (optional)</Label>
                  <Input id="bw-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
              </>
            )}
          </div>
        ) : null}

        {step === 5 ? (
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-muted">Doctor</dt>
              <dd>{doctorName(state, doctorId)}</dd>
            </div>
            <div>
              <dt className="text-muted">Service</dt>
              <dd>
                {serviceName(state, effectiveServiceId)} ·{" "}
                {ds ? formatPkr(ds.feePaisa) : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-muted">When</dt>
              <dd>
                {slot
                  ? formatKarachi(slot, "EEE dd MMM yyyy · hh:mm a")
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-muted">Patient</dt>
              <dd>
                {patientMode === "existing"
                  ? state.patients.find((p) => p.id === patientId)?.fullName
                  : fullName}
              </dd>
            </div>
          </dl>
        ) : null}

        <div className="flex justify-between pt-2">
          <Button
            type="button"
            variant="secondary"
            disabled={step === 0 || busy}
            onClick={() => setStep((s) => s - 1)}
          >
            Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button
              type="button"
              disabled={
                (step === 3 && !slot) ||
                (step === 4 &&
                  patientMode === "new" &&
                  (!fullName.trim() || !phone.trim()))
              }
              onClick={() => setStep((s) => s + 1)}
            >
              Next
            </Button>
          ) : (
            <Button type="button" disabled={busy || !slot} onClick={confirm}>
              {busy ? "Confirming…" : "Confirm booking"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
