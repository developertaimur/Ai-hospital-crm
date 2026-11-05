"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { withDemoRepo } from "@/lib/store/demo-store";
import * as repo from "@/lib/mock/repository";
import { useDemoReady } from "@/lib/hooks/use-demo-ready";

export default function AdminStaffPage() {
  const { ready, state } = useDemoReady();
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);

  if (!ready || !state) {
    return <p className="text-sm text-muted">Loading staff…</p>;
  }

  async function toggleActive(userId: string, active: boolean) {
    if (busy) return;
    setBusy(true);
    try {
      await withDemoRepo((a) =>
        repo.simulateStaffAccountChange(a, userId, { active: !active }),
      );
      toast({ title: "[Simulated] Account status updated" });
    } catch (e) {
      toast({
        title: "Failed",
        description: e instanceof Error ? e.message : undefined,
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  }

  async function rename(userId: string) {
    if (busy || !newName.trim()) return;
    setBusy(true);
    try {
      await withDemoRepo((a) =>
        repo.simulateStaffAccountChange(a, userId, {
          displayName: newName.trim(),
        }),
      );
      toast({ title: "[Simulated] Display name updated" });
      setNewName("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Staff</h1>
      <p className="text-sm text-muted">
        Create, disable, role, and password reset are simulated only — no real
        identity provider.
      </p>
      <div className="rounded-lg border border-dashed border-border p-4">
        <p className="text-sm font-medium">Simulated create account</p>
        <p className="text-xs text-muted">
          Not persisted — use demo login accounts table on sign-in page.
        </p>
        <Button type="button" className="mt-2" variant="secondary" disabled>
          Create user (simulated — disabled)
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Username</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {state.users.map((u) => (
            <TableRow key={u.id}>
              <TableCell>{u.displayName}</TableCell>
              <TableCell>{u.username}</TableCell>
              <TableCell className="capitalize">{u.role}</TableCell>
              <TableCell>
                {u.active ? (
                  <Badge variant="success">Active</Badge>
                ) : (
                  <Badge variant="destructive">Disabled</Badge>
                )}
              </TableCell>
              <TableCell className="space-x-2">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={busy}
                  onClick={() => toggleActive(u.id, u.active)}
                >
                  {u.active ? "Disable (sim)" : "Enable (sim)"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={busy}
                  onClick={() =>
                    toast({
                      title: "[Simulated] Password reset email queued",
                    })
                  }
                >
                  Reset pwd (sim)
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="max-w-md space-y-2 rounded-lg border border-border p-4">
        <Label htmlFor="rename">Simulated rename (pick first staff row)</Label>
        <Input
          id="rename"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New display name"
        />
        <Button
          type="button"
          size="sm"
          disabled={!newName.trim() || busy}
          onClick={() => state.users[0] && rename(state.users[0].id)}
        >
          Apply to {state.users[0]?.username}
        </Button>
      </div>
    </div>
  );
}
