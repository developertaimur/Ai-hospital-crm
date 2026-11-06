"use client";

import Link from "next/link";
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
      toast({ title: "Account status updated" });
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
      toast({ title: "Display name updated" });
      setNewName("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Staff</h1>
      <p className="text-sm text-muted">
        Doctor create / login assignment lives on{" "}
        <Link href="/admin/doctors" className="text-primary hover:underline">
          Doctors
        </Link>
        . Passwords shown here are demo-only (browser state).
      </p>
      <div className="rounded-lg border border-dashed border-border p-4">
        <p className="text-sm font-medium">Create doctor account</p>
        <p className="text-xs text-muted">
          Use Admin → Doctors → Add doctor to create profile + username/password.
        </p>
        <Button type="button" className="mt-2" variant="secondary" asChild>
          <Link href="/admin/doctors">Open Doctors</Link>
        </Button>
      </div>
      <div className="space-y-2">
        <Label htmlFor="rename">Rename selected user (display name)</Label>
        <Input
          id="rename"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New display name"
        />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Username</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Password</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {state.users.map((u) => (
            <TableRow key={u.id}>
              <TableCell>{u.displayName}</TableCell>
              <TableCell>
                <code className="text-xs">{u.username}</code>
              </TableCell>
              <TableCell className="capitalize">{u.role}</TableCell>
              <TableCell>
                <code className="text-xs">{u.password ?? "—"}</code>
              </TableCell>
              <TableCell>
                <Badge variant={u.active ? "success" : "destructive"}>
                  {u.active ? "Active" : "Inactive"}
                </Badge>
              </TableCell>
              <TableCell className="space-x-2">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={busy}
                  onClick={() => void toggleActive(u.id, u.active)}
                >
                  {u.active ? "Disable" : "Enable"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={busy || !newName.trim()}
                  onClick={() => void rename(u.id)}
                >
                  Rename
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
