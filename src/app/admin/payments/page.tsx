"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AppointmentTable } from "@/components/appointments/appointment-table";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { Panel } from "@/components/layout/panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDemoReady } from "@/lib/hooks/use-demo-ready";
import { bookingRef, patientName } from "@/lib/display/lookups";
import { formatPkr } from "@/lib/money";
import { formatKarachi } from "@/lib/time";

type PaymentView = "all" | "awaiting" | "verified" | "outstanding";

export default function AdminPaymentsPage() {
  const { ready, state } = useDemoReady();
  const searchParams = useSearchParams();
  const paramView = searchParams.get("view");
  const resolvedView: PaymentView =
    paramView === "awaiting" ||
    paramView === "verified" ||
    paramView === "outstanding"
      ? paramView
      : "all";
  const [view, setView] = useState<PaymentView>(resolvedView);

  useEffect(() => {
    setView(resolvedView);
  }, [resolvedView]);

  const awaitingAppointments = useMemo(() => {
    if (!state) return [];
    return state.appointments.filter((a) => a.status === "awaiting_payment");
  }, [state]);

  const outstandingAppointments = useMemo(() => {
    if (!state) return [];
    return state.appointments.filter(
      (a) =>
        a.paymentStatus === "unpaid" ||
        a.paymentStatus === "partial" ||
        a.paymentStatus === "review_required",
    );
  }, [state]);

  const payments = useMemo(() => {
    if (!state) return [];
    if (view === "verified") {
      return state.payments.filter((p) => p.verified);
    }
    return state.payments;
  }, [state, view]);

  const verifiedTotal = useMemo(
    () =>
      payments
        .filter((p) => p.verified)
        .reduce((sum, p) => sum + p.amountPaisa, 0),
    [payments],
  );

  if (!ready || !state) {
    return <p className="text-sm text-muted">Loading payments…</p>;
  }

  const title =
    view === "awaiting"
      ? "Awaiting payment"
      : view === "verified"
        ? "Verified payments"
        : view === "outstanding"
          ? "Outstanding balances"
          : "Payments";

  return (
    <div className="space-y-6">
      <DashboardHeader
        eyebrow="Finance"
        title={title}
        description="Review provisional holds, verify payments, and clear outstanding balances."
        badge={
          <Badge variant="secondary">
            Ledger {formatPkr(verifiedTotal)}
          </Badge>
        }
        actions={
          <Select
            value={view}
            onValueChange={(v) => setView(v as PaymentView)}
          >
            <SelectTrigger className="h-9 w-44 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All views</SelectItem>
              <SelectItem value="awaiting">Awaiting payment</SelectItem>
              <SelectItem value="outstanding">Outstanding</SelectItem>
              <SelectItem value="verified">Verified only</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      {(view === "all" || view === "awaiting") && (
        <Panel
          title="Provisional holds"
          description={`${awaitingAppointments.length} appointment${awaitingAppointments.length === 1 ? "" : "s"} awaiting payment verification`}
          action={
            view !== "awaiting" ? (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="rounded-xl"
                onClick={() => setView("awaiting")}
              >
                Focus awaiting
              </Button>
            ) : null
          }
        >
          <AppointmentTable
            state={state}
            appointments={awaitingAppointments}
            showPaymentVerify
            emptyMessage="No appointments awaiting payment."
          />
        </Panel>
      )}

      {(view === "all" || view === "outstanding") && (
        <Panel
          title="Outstanding balances"
          description="Unpaid, partial, or review-required payment status"
        >
          <AppointmentTable
            state={state}
            appointments={
              view === "outstanding"
                ? outstandingAppointments
                : outstandingAppointments
            }
            showPaymentVerify
            emptyMessage="No outstanding balances."
          />
        </Panel>
      )}

      {(view === "all" || view === "verified") && (
        <Panel
          title="Payment ledger"
          description={
            view === "verified"
              ? "Verified payments only"
              : "All recorded payments"
          }
        >
          <div className="overflow-hidden rounded-2xl border border-border/80">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Patient</TableHead>
                  <TableHead>Booking</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Verified</TableHead>
                  <TableHead>When</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted">
                      No payments in this view.
                    </TableCell>
                  </TableRow>
                ) : (
                  payments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{patientName(state, p.patientId)}</TableCell>
                      <TableCell>{bookingRef(p.appointmentId)}</TableCell>
                      <TableCell>{formatPkr(p.amountPaisa)}</TableCell>
                      <TableCell className="capitalize">
                        {p.method.replace("_", " ")}
                      </TableCell>
                      <TableCell>
                        {p.verified ? (
                          <Badge variant="success">Verified</Badge>
                        ) : (
                          <Badge variant="secondary">No</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {p.verifiedAt
                          ? formatKarachi(p.verifiedAt, "dd MMM yyyy · hh:mm a")
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Panel>
      )}

      {state.paymentClaims.length > 0 && view !== "verified" ? (
        <Panel title="Payment claims" description="Submitted claims awaiting review">
          <div className="overflow-hidden rounded-2xl border border-border/80">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Booking</TableHead>
                  <TableHead>Claimed</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {state.paymentClaims.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>{bookingRef(c.appointmentId)}</TableCell>
                    <TableCell>{formatPkr(c.claimedAmountPaisa)}</TableCell>
                    <TableCell>{c.status.replace("_", " ")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Panel>
      ) : null}
    </div>
  );
}
