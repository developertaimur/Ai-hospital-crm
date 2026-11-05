"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { withDemoRepo } from "@/lib/store/demo-store";
import * as repo from "@/lib/mock/repository";
import type { Appointment } from "@/lib/types";
import { useActorUserId } from "@/lib/hooks/use-effective-role";
import { useDemoStore } from "@/lib/store/demo-store";

interface CancelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: Appointment;
}

export function CancelDialog({
  open,
  onOpenChange,
  appointment,
}: CancelDialogProps) {
  const actorUserId = useActorUserId();
  const [busy, setBusy] = useState(false);
  const aiPolicy =
    useDemoStore((s) => s.state?.hospitalSettings.aiChangePolicy) ??
    "pending_configuration";

  async function submit() {
    if (busy) return;
    setBusy(true);
    try {
      await withDemoRepo((adapter) =>
        repo.cancelAppointment(adapter, {
          appointmentId: appointment.id,
          actorUserId,
        }),
      );
      toast({ title: "Appointment cancelled" });
      onOpenChange(false);
    } catch (e) {
      toast({
        title: "Cancel failed",
        description: e instanceof Error ? e.message : undefined,
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel appointment</DialogTitle>
          <DialogDescription>
            Paid amounts may require refund review (no auto refund). AI cancel
            path:{" "}
            {aiPolicy === "pending_configuration"
              ? "not configured — using staff action."
              : aiPolicy.replace("_", " ")}
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => onOpenChange(false)}
          >
            Keep appointment
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={busy}
            onClick={submit}
          >
            {busy ? "Cancelling…" : "Cancel appointment"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
