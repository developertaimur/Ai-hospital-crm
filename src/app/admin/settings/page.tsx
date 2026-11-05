"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDemoReady } from "@/lib/hooks/use-demo-ready";

export default function AdminSettingsPage() {
  const { ready, state } = useDemoReady();
  if (!ready || !state) {
    return <p className="text-sm text-muted">Loading settings…</p>;
  }

  const s = state.hospitalSettings;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <Card>
        <CardHeader>
          <CardTitle>{s.hospitalName}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            <span className="text-muted">Location: </span>
            {s.locationPlaceholder}
          </p>
          <p>
            <span className="text-muted">Timezone: </span>
            {s.timezone}
          </p>
          <p>
            <span className="text-muted">Transfer phone: </span>
            {s.transferPhoneNumber ?? (
              <Badge variant="warning">Unconfigured</Badge>
            )}
          </p>
          <p>
            <span className="text-muted">Clinical escalation: </span>
            {s.clinicalEscalationContact ?? (
              <Badge variant="warning">Not configured</Badge>
            )}
          </p>
          <p>
            <span className="text-muted">AI change policy: </span>
            {s.aiChangePolicy === "pending_configuration" ? (
              <Badge variant="warning">Pending configuration</Badge>
            ) : (
              s.aiChangePolicy.replace("_", " ")
            )}
          </p>
          <p>
            <span className="text-muted">Reservation expiry: </span>
            {s.defaultReservationExpiryMinutes} minutes
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
