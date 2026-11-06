"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/status-badge";
import { toast } from "@/components/ui/use-toast";
import { withDemoRepo } from "@/lib/store/demo-store";
import * as repo from "@/lib/mock/repository";
import { formatKarachi } from "@/lib/time";
import type { CallbackRequest, DemoState } from "@/lib/types";
import { doctorName, patientName, userDisplayName } from "@/lib/display/lookups";
import { useActorUserId } from "@/lib/hooks/use-effective-role";
import {
  getPermissionsForUser,
  hasPermission,
} from "@/lib/auth/demo-accounts";
import Link from "next/link";

interface CallbackDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  callback: CallbackRequest | null;
  state: DemoState;
}

export function CallbackDetailSheet({
  open,
  onOpenChange,
  callback,
  state,
}: CallbackDetailSheetProps) {
  const actorUserId = useActorUserId();
  const [note, setNote] = useState("");
  const [assignUserId, setAssignUserId] = useState("");
  const [busy, setBusy] = useState(false);

  if (!callback) return null;

  const canManage =
    !!actorUserId &&
    hasPermission(getPermissionsForUser(actorUserId), "manage_callbacks");

  const staff = state.users.filter(
    (u) => u.role === "admin" || u.role === "reception",
  );

  async function run(action: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    try {
      await action();
    } catch (e) {
      toast({
        title: "Action failed",
        description: e instanceof Error ? e.message : undefined,
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto pb-10">
        <SheetHeader>
          <SheetTitle>{patientName(state, callback.patientId)}</SheetTitle>
          <SheetDescription>Callback {callback.id}</SheetDescription>
        </SheetHeader>
        <div className="mt-4 space-y-4 px-6 text-sm">
          <StatusBadge status={callback.status} />
          <dl className="grid gap-2">
            <div>
              <dt className="text-muted">Phone</dt>
              <dd>{callback.phoneE164}</dd>
            </div>
            <div>
              <dt className="text-muted">Reason</dt>
              <dd className="whitespace-pre-wrap">{callback.reason}</dd>
            </div>
            <div>
              <dt className="text-muted">Preferred window</dt>
              <dd>{callback.preferredWindow ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted">Language</dt>
              <dd>{callback.language?.toUpperCase() ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted">Requested doctor</dt>
              <dd>
                {callback.requestedDoctorId
                  ? doctorName(state, callback.requestedDoctorId)
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-muted">Assigned to</dt>
              <dd>
                {callback.assignedToUserId
                  ? userDisplayName(state, callback.assignedToUserId)
                  : "Unassigned"}
              </dd>
            </div>
            <div>
              <dt className="text-muted">Summary</dt>
              <dd className="whitespace-pre-wrap">{callback.summary ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted">Transcript</dt>
              <dd>
                {callback.transcriptUnavailable
                  ? "Unavailable in demo"
                  : "Not stored"}
              </dd>
            </div>
            <div>
              <dt className="text-muted">Created</dt>
              <dd>{formatKarachi(callback.createdAt, "dd MMM yyyy · hh:mm a")}</dd>
            </div>
            <div>
              <dt className="text-muted">Updated</dt>
              <dd>{formatKarachi(callback.updatedAt, "dd MMM yyyy · hh:mm a")}</dd>
            </div>
          </dl>

          {callback.notes.length > 0 ? (
            <div>
              <p className="font-medium">Notes</p>
              <ul className="mt-2 space-y-2">
                {callback.notes.map((n) => (
                  <li key={n.id} className="rounded-md border border-border p-2">
                    <p className="text-xs text-muted">
                      {userDisplayName(state, n.authorUserId)} ·{" "}
                      {formatKarachi(n.createdAt, "dd MMM · hh:mm a")}
                    </p>
                    <p className="whitespace-pre-wrap">{n.body}</p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {canManage ? (
            <>
              <div className="space-y-2 border-t border-border pt-4">
                <Label htmlFor="cb-assign">Assign (simulated)</Label>
                <Select value={assignUserId} onValueChange={setAssignUserId}>
                  <SelectTrigger id="cb-assign">
                    <SelectValue placeholder="Select staff" />
                  </SelectTrigger>
                  <SelectContent>
                    {staff.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={!assignUserId || busy || !actorUserId}
                  onClick={() =>
                    run(async () => {
                      await withDemoRepo((a) =>
                        repo.assignCallback(
                          a,
                          callback.id,
                          assignUserId,
                          actorUserId!,
                        ),
                      );
                      toast({ title: "Assigned (simulated)" });
                    })
                  }
                >
                  Assign
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cb-note">Add note</Label>
                <Textarea
                  id="cb-note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                />
                <Button
                  type="button"
                  size="sm"
                  disabled={!note.trim() || !actorUserId || busy}
                  onClick={() =>
                    run(async () => {
                      await withDemoRepo((a) =>
                        repo.addCallbackNote(
                          a,
                          callback.id,
                          actorUserId!,
                          note.trim(),
                        ),
                      );
                      setNote("");
                      toast({ title: "Note added" });
                    })
                  }
                >
                  Save note
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={busy}
                  onClick={() =>
                    run(async () => {
                      await withDemoRepo((a) =>
                        repo.updateCallbackStatus(
                          a,
                          callback.id,
                          "in_progress",
                          actorUserId,
                        ),
                      );
                      toast({ title: "Simulated outbound call started" });
                    })
                  }
                >
                  Simulate call
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={busy}
                  onClick={() =>
                    run(async () => {
                      await withDemoRepo((a) =>
                        repo.updateCallbackStatus(
                          a,
                          callback.id,
                          "in_progress",
                          actorUserId,
                        ),
                      );
                      toast({ title: "Follow-up logged (simulated)" });
                    })
                  }
                >
                  Log follow-up
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={busy}
                  onClick={() =>
                    run(async () => {
                      await withDemoRepo((a) =>
                        repo.updateCallbackStatus(
                          a,
                          callback.id,
                          "completed",
                          actorUserId,
                        ),
                      );
                      toast({
                        title: "Callback completed",
                        description: "Payment status unchanged.",
                      });
                    })
                  }
                >
                  Complete
                </Button>
                <Button type="button" size="sm" variant="secondary" asChild>
                  <Link href="/admin/new-appointment">
                    Open appointment booking
                  </Link>
                </Button>
              </div>
            </>
          ) : (
            <p className="rounded-lg border border-dashed border-border bg-background px-3 py-3 text-xs text-muted">
              Callback management (assign, notes, complete) is Admin-only.
              Status above is view-only for this role.
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
