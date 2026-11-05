"use client";

import { useState } from "react";
import { AppointmentTable } from "@/components/appointments/appointment-table";
import { PaymentPanel } from "@/components/payments/payment-panel";
import { useDemoReady } from "@/lib/hooks/use-demo-ready";

export default function ReceptionAwaitingPaymentPage() {
  const { ready, state } = useDemoReady();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (!ready || !state) {
    return <p className="text-sm text-muted">Loading…</p>;
  }

  const awaiting = state.appointments.filter(
    (a) => a.status === "awaiting_payment" || a.paymentStatus === "partial",
  );
  const selected = awaiting.find((a) => a.id === selectedId) ?? awaiting[0] ?? null;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Awaiting payment</h1>
      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <AppointmentTable
            state={state}
            appointments={awaiting}
            onAppointmentSelect={(id) => setSelectedId(id)}
          />
        </div>
        <div>
          {selected ? (
            <PaymentPanel appointment={selected} payments={state.payments} />
          ) : (
            <p className="text-sm text-muted">No appointments awaiting payment.</p>
          )}
        </div>
      </div>
    </div>
  );
}
