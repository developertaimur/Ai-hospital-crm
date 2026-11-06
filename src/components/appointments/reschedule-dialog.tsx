"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { withDemoRepo } from "@/lib/store/demo-store";
import * as repo from "@/lib/mock/repository";
import { formatKarachi, toKarachiDateKey } from "@/lib/time";
import type { Appointment, DemoState } from "@/lib/types";
import { useActorUserId } from "@/lib/hooks/use-effective-role";

interface RescheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: Appointment;
  state: DemoState;
}

export function RescheduleDialog({
  open,
  onOpenChange,
  appointment,
  state,
}: RescheduleDialogProps) {
  const actorUserId = useActorUserId();
  const [dateKey, setDateKey] = useState(
    toKarachiDateKey(appointment.scheduledStartIso),
  );
  const [slots, setSlots] = useState<string[]>([]);
  const [slot, setSlot] = useState("");
  const [busy, setBusy] = useState(false);
  const aiPolicy = state.hospitalSettings.aiChangePolicy;

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void withDemoRepo((adapter) =>
      repo.getAvailableSlots(adapter, {
        doctorId: appointment.doctorId,
        serviceId: appointment.serviceId,
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
  }, [open, dateKey, appointment.doctorId, appointment.serviceId]);

  async function submit() {
    if (!slot || busy) return;
    setBusy(true);
    try {
      await withDemoRepo((adapter) =>
        repo.rescheduleAppointment(adapter, {
          appointmentId: appointment.id,
          newStartIso: slot,
          actorUserId,
        }),
      );
      toast({ title: "Appointment rescheduled" });
      onOpenChange(false);
    } catch (e) {
      toast({
        title: "Reschedule failed",
        description: e instanceof Error ? e.message : undefined,
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  }

  const dates = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return toKarachiDateKey(d.toISOString());
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reschedule appointment</DialogTitle>
          <DialogDescription>
            Choose a new slot. AI-assisted changes:{" "}
            {aiPolicy === "pending_configuration"
              ? "policy pending — staff path only."
              : aiPolicy.replace("_", " ")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="rs-date">Date</Label>
            <Select value={dateKey} onValueChange={setDateKey}>
              <SelectTrigger id="rs-date">
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
          <div className="space-y-1">
            <Label htmlFor="rs-slot">Time slot</Label>
            <Select value={slot} onValueChange={setSlot}>
              <SelectTrigger id="rs-slot">
                <SelectValue placeholder="Select slot" />
              </SelectTrigger>
              <SelectContent>
                {slots.map((s) => (
                  <SelectItem key={s} value={s}>
                    {formatKarachi(s, "hh:mm a")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="button" disabled={!slot || busy} onClick={submit}>
            {busy ? "Saving…" : "Confirm reschedule"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
