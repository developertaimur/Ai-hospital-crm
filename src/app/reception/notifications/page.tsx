"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { NotificationPreview } from "@/components/notifications/notification-preview";
import { toast } from "@/components/ui/use-toast";
import { withDemoRepo } from "@/lib/store/demo-store";
import * as repo from "@/lib/mock/repository";
import { useDemoReady } from "@/lib/hooks/use-demo-ready";
import { patientName } from "@/lib/display/lookups";
import { formatKarachi } from "@/lib/time";

export default function ReceptionNotificationsPage() {
  const { ready, state } = useDemoReady();
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!ready || !state) {
    return <p className="text-sm text-muted">Loading…</p>;
  }

  const preview = state.notifications.find((n) => n.id === previewId);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Notifications</h1>
      <p className="text-sm text-muted">
        SMS / WhatsApp / email delivery is simulated in this demo.
      </p>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Patient</TableHead>
            <TableHead>Kind</TableHead>
            <TableHead>Locale</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {state.notifications.map((n) => (
            <TableRow key={n.id}>
              <TableCell>{patientName(state, n.patientId)}</TableCell>
              <TableCell>{n.kind.replace(/_/g, " ")}</TableCell>
              <TableCell className="uppercase">{n.locale}</TableCell>
              <TableCell>
                <Badge
                  variant={
                    n.status === "failed_simulated" ? "destructive" : "secondary"
                  }
                >
                  {n.status.replace(/_/g, " ")}
                </Badge>
              </TableCell>
              <TableCell className="space-x-2">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => setPreviewId(n.id)}
                >
                  Preview EN/UR
                </Button>
                {n.status === "failed_simulated" ? (
                  <Button
                    type="button"
                    size="sm"
                    disabled={busy}
                    onClick={() => {
                      setBusy(true);
                      void withDemoRepo((a) => repo.retryNotification(a, n.id))
                        .then(() =>
                          toast({ title: "Retry sent (simulated)" }),
                        )
                        .finally(() => setBusy(false));
                    }}
                  >
                    Retry (sim)
                  </Button>
                ) : null}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {preview && preview.appointmentId ? (
        <div className="rounded-lg border border-border p-4">
          <p className="mb-2 text-sm font-medium">
            Template preview · {formatKarachi(preview.createdAt, "dd MMM · hh:mm a")}
          </p>
          <NotificationPreview
            appointmentId={preview.appointmentId}
            templateKey={
              preview.kind === "appointment_confirmed"
                ? "confirmation"
                : preview.kind === "appointment_rescheduled"
                  ? "reschedule"
                  : preview.kind === "appointment_cancelled"
                    ? "cancel"
                    : "provisional"
            }
          />
          <p className="mt-2 text-xs text-muted whitespace-pre-wrap">
            Stored body ({preview.locale}): {preview.body}
          </p>
        </div>
      ) : null}
    </div>
  );
}
