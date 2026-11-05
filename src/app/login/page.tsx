"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DEMO_ACCOUNTS, getHomePath } from "@/lib/auth/demo-accounts";
import { useAuthStore } from "@/lib/store/auth-store";
import { useDemoStore } from "@/lib/store/demo-store";

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const setSession = useDemoStore((s) => s.setSession);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    const ok = login(username.trim(), password);
    if (!ok) {
      setError("Invalid demo username or password.");
      setBusy(false);
      return;
    }
    const session = useAuthStore.getState().session!;
    setSession(session);
    useDemoStore.getState().hydrate();
    router.push(getHomePath(session.role));
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Life Care International Hospital
          </p>
          <CardTitle>Sign in (demo)</CardTitle>
          <CardDescription>
            Local demo only — not secure authentication. Passwords are visible
            below for convenience.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <div className="mt-8">
            <h2 className="mb-2 text-sm font-semibold">Demo credentials</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Password</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {DEMO_ACCOUNTS.map((a) => (
                  <TableRow key={a.username}>
                    <TableCell className="capitalize">{a.role}</TableCell>
                    <TableCell>
                      <code className="text-xs">{a.username}</code>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs">{a.password}</code>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
