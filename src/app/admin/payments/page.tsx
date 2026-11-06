"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDemoReady } from "@/lib/hooks/use-demo-ready";
import { formatPkr } from "@/lib/money";
import { formatKarachi } from "@/lib/time";
import { bookingRef, patientName } from "@/lib/display/lookups";
import { Badge } from "@/components/ui/badge";

export default function AdminPaymentsPage() {
  const { ready, state } = useDemoReady();
  if (!ready || !state) {
    return <p className="text-sm text-muted">Loading payments…</p>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold sm:text-2xl">Payments</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Patient</TableHead>
            <TableHead>Booking</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Method</TableHead>
            <TableHead>Verified</TableHead>
            <TableHead>When</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {state.payments.map((p) => (
            <TableRow key={p.id}>
              <TableCell>{patientName(state, p.patientId)}</TableCell>
              <TableCell>{bookingRef(p.appointmentId)}</TableCell>
              <TableCell>{formatPkr(p.amountPaisa)}</TableCell>
              <TableCell className="capitalize">{p.method.replace("_", " ")}</TableCell>
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
          ))}
        </TableBody>
      </Table>
      {state.paymentClaims.length > 0 ? (
        <>
          <h2 className="text-lg font-semibold">Payment claims (review)</h2>
          <Table>
            <TableHeader>
              <TableRow>
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
        </>
      ) : null}
    </div>
  );
}
