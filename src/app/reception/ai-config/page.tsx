"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDemoReady } from "@/lib/hooks/use-demo-ready";

export default function ReceptionAiConfigPage() {
  const { ready, state } = useDemoReady();

  if (!ready || !state) {
    return <p className="text-sm text-muted">Loading…</p>;
  }

  const policy = state.hospitalSettings.aiChangePolicy;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">AI configuration</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Appointment change policy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {policy === "pending_configuration" ? (
            <Badge variant="warning">Pending configuration</Badge>
          ) : (
            <p className="capitalize">{policy.replace(/_/g, " ")}</p>
          )}
          <p className="text-muted">
            Reschedule and cancel dialogs show this policy. Automated AI changes
            are not enabled in the demo until configured by hospital admin.
          </p>
          <p className="text-muted">
            Transfer number:{" "}
            {state.hospitalSettings.transferPhoneNumber ?? "Unconfigured"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
