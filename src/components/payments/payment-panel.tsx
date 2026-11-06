"use client";

import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/status-badge";
import { toast } from "@/components/ui/use-toast";
import {
  getPermissionsForUser,
  hasPermission,
} from "@/lib/auth/demo-accounts";
import { formatPkr, parsePkrToPaisa } from "@/lib/money";
import { formatKarachi, getDemoNow } from "@/lib/time";
import { withDemoRepo } from "@/lib/store/demo-store";
import * as repo from "@/lib/mock/repository";
import type { Appointment, Payment } from "@/lib/types";
import { useActorUserId } from "@/lib/hooks/use-effective-role";

interface PaymentPanelProps {
  appointment: Appointment;
  payments: Payment[];
}

export function PaymentPanel({ appointment, payments }: PaymentPanelProps) {
  const actorUserId = useActorUserId();
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<Payment["method"]>("cash");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const aptPayments = payments.filter((p) => p.appointmentId === appointment.id);
  const canVerify =
    !!actorUserId &&
    hasPermission(getPermissionsForUser(actorUserId), "verify_payment");

  const balance = appointment.totalFeePaisa - appointment.verifiedAmountPaisa;
  const nowLabel = formatKarachi(getDemoNow().toISOString(), "dd MMM yyyy, hh:mm a");

  async function onVerify() {
    if (!actorUserId || busy) return;
    const paisa = parsePkrToPaisa(amount);
    if (!Number.isFinite(paisa) || paisa <= 0) {
      toast({ title: "Enter a valid amount", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      await withDemoRepo((adapter) =>
        repo.recordVerifiedPayment(adapter, {
          appointmentId: appointment.id,
          amountPaisa: paisa,
          actorUserId,
          method,
          reference: reference || undefined,
        }),
      );
      toast({ title: "Payment recorded (simulated verify)" });
      setAmount("");
      setReference("");
      setNote("");
    } catch (e) {
      toast({
        title: "Could not record payment",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4 rounded-lg border border-border bg-background/50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="font-semibold">Payment</h4>
        <StatusBadge status={appointment.paymentStatus} />
      </div>
      <dl className="grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted">Total fee</dt>
          <dd className="font-medium">{formatPkr(appointment.totalFeePaisa)}</dd>
        </div>
        <div>
          <dt className="text-muted">Previously verified</dt>
          <dd className="font-medium">
            {formatPkr(appointment.verifiedAmountPaisa)}
          </dd>
        </div>
        <div>
          <dt className="text-muted">Balance</dt>
          <dd className="font-medium">{formatPkr(Math.max(0, balance))}</dd>
        </div>
        <div>
          <dt className="text-muted">Appointment status</dt>
          <dd>
            <StatusBadge status={appointment.status} />
          </dd>
        </div>
      </dl>

      {aptPayments.length > 0 ? (
        <div>
          <p className="mb-2 text-sm font-medium">Verification history</p>
          <ul className="space-y-1 text-sm">
            {aptPayments.map((p) => (
              <li key={p.id} className="text-muted">
                {formatPkr(p.amountPaisa)} · {p.method}
                {p.reference ? ` · ref ${p.reference}` : ""} ·{" "}
                {p.verifiedAt
                  ? formatKarachi(p.verifiedAt, "dd MMM yyyy, hh:mm a")
                  : "—"}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {canVerify ? (
        <div className="space-y-3 border-t border-border pt-4">
          <p className="text-xs text-muted">
            Staff verification updates shared state. Minimum 50% confirms
            booking when eligible.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="pay-amount">New amount (PKR)</Label>
              <Input
                id="pay-amount"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 2500"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="pay-method">Method</Label>
              <Select
                value={method}
                onValueChange={(v) => setMethod(v as Payment["method"])}
              >
                <SelectTrigger id="pay-method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="bank_transfer">Bank transfer</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="pay-ref">Reference</Label>
              <Input
                id="pay-ref"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Date & time (Karachi)</Label>
              <Input readOnly value={nowLabel} aria-readonly />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="pay-note">Note</Label>
            <Textarea
              id="pay-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
            />
          </div>
          <Button type="button" disabled={busy} onClick={onVerify}>
            {busy ? "Saving…" : "Verify payment"}
          </Button>
        </div>
      ) : (
        <p className="text-sm text-muted">
          Payment verification is not available for your role. Clearance status
          is shown for reference only.
        </p>
      )}
    </div>
  );
}
