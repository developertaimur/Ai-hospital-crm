"use client";

import { useId, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Hospital, Lock, UserRound } from "lucide-react";
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
import { getHomePath, listLoginAccounts } from "@/lib/auth/demo-accounts";
import { useAuthStore } from "@/lib/store/auth-store";
import { useDemoStore } from "@/lib/store/demo-store";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const setSession = useDemoStore((s) => s.setSession);
  const hydrate = useDemoStore((s) => s.hydrate);
  const demoUsers = useDemoStore((s) => s.state?.users);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [accountsOpen, setAccountsOpen] = useState(false);
  const accountsPanelId = useId();

  const loginAccounts = listLoginAccounts(demoUsers);

  function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    hydrate();
    const users = useDemoStore.getState().state?.users;
    const ok = login(username.trim(), password, users);
    if (!ok) {
      setError("Invalid username or password.");
      setBusy(false);
      return;
    }
    const session = useAuthStore.getState().session!;
    setSession(session);
    router.push(getHomePath(session.role));
  }

  function fillAccount(user: string, pass: string) {
    setUsername(user);
    setPassword(pass);
    setError("");
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(15,118,110,0.12),_transparent_55%),radial-gradient(ellipse_at_bottom_right,_rgba(15,23,42,0.06),_transparent_45%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-24 top-16 size-72 rounded-full bg-primary/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-16 bottom-10 size-64 rounded-full bg-slate-300/30 blur-3xl"
        aria-hidden
      />

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md shadow-primary/25">
            <Hospital className="size-7" aria-hidden />
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Life Care International Hospital
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
            Sign in
          </h1>
          <p className="mt-1 text-sm text-muted">
            Islamabad operations workspace
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6 shadow-lg shadow-slate-900/5 sm:p-8">
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <UserRound
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
                  aria-hidden
                />
                <Input
                  id="username"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="h-11 rounded-xl pl-9"
                  placeholder="Enter username"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
                  aria-hidden
                />
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 rounded-xl pl-9"
                  placeholder="Enter password"
                />
              </div>
            </div>
            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}
            <Button
              type="submit"
              className="h-11 w-full rounded-xl text-base"
              disabled={busy}
            >
              {busy ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <div className="mt-6 border-t border-border pt-4">
            <button
              type="button"
              className="flex w-full items-center justify-between rounded-xl px-2 py-2 text-left text-sm font-medium text-foreground transition hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-expanded={accountsOpen}
              aria-controls={accountsPanelId}
              onClick={() => setAccountsOpen((o) => !o)}
            >
              <span>Sample account credentials</span>
              <ChevronDown
                className={cn(
                  "size-4 text-muted transition-transform duration-200",
                  accountsOpen && "rotate-180",
                )}
                aria-hidden
              />
            </button>

            <div
              id={accountsPanelId}
              hidden={!accountsOpen}
              className={cn(
                "overflow-hidden transition-[grid-template-rows] duration-200",
                accountsOpen ? "mt-3" : "",
              )}
            >
              {accountsOpen ? (
                <div className="rounded-xl border border-border bg-background/80 p-2">
                  <p className="mb-2 px-2 text-xs text-muted">
                    Tap a row to fill the form. For local review only — not
                    production authentication.
                  </p>
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead>Role</TableHead>
                        <TableHead>Username</TableHead>
                        <TableHead>Password</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loginAccounts.map((a) => (
                        <TableRow
                          key={`${a.source}-${a.username}`}
                          tabIndex={0}
                          role="button"
                          aria-label={`Use ${a.role} account ${a.username}`}
                          className="cursor-pointer hover:bg-primary/[0.05]"
                          onClick={() => fillAccount(a.username, a.password)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              fillAccount(a.username, a.password);
                            }
                          }}
                        >
                          <TableCell className="capitalize">
                            {a.role}
                            {a.source === "admin" ? (
                              <span className="ml-1 text-[10px] text-muted">
                                (admin)
                              </span>
                            ) : null}
                          </TableCell>
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
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
