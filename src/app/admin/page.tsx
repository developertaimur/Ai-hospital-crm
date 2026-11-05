"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDemoReady } from "@/lib/hooks/use-demo-ready";
import { getDemoNow, toKarachiDateKey } from "@/lib/time";
import { formatPkr } from "@/lib/money";

export default function AdminDashboardPage() {
  const { ready, state } = useDemoReady();
  if (!ready || !state) {
    return <p className="text-sm text-muted">Loading dashboard…</p>;
  }

  const todayKey = toKarachiDateKey(getDemoNow().toISOString());
  const todayApts = state.appointments.filter(
    (a) => toKarachiDateKey(a.scheduledStartIso) === todayKey,
  );
  const awaitingPayment = state.appointments.filter(
    (a) => a.status === "awaiting_payment",
  ).length;
  const confirmed = state.appointments.filter(
    (a) => a.status === "confirmed",
  ).length;
  const pendingCallbacks = state.callbacks.filter(
    (c) => c.status === "pending" || c.status === "assigned",
  ).length;
  const verifiedPayments = state.payments.filter((p) => p.verified).length;
  const outstanding = state.appointments.filter(
    (a) =>
      a.paymentStatus === "unpaid" ||
      a.paymentStatus === "partial" ||
      a.paymentStatus === "review_required",
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted">
          Karachi date {todayKey} · derived from shared demo state
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Today&apos;s appointments</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{todayApts.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Awaiting payment</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-warning">
              {awaitingPayment}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Confirmed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-success">{confirmed}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pending callbacks</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{pendingCallbacks}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Verified payments</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-success">
              {verifiedPayments}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Outstanding balances</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-warning">
              {outstanding}
            </p>
            <p className="mt-1 text-xs text-muted">
              Total verified today:{" "}
              {formatPkr(
                state.payments.reduce((s, p) => s + p.amountPaisa, 0),
              )}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
