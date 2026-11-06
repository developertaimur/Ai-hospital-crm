"use client";

import { useMemo, useState } from "react";
import {
  KeyRound,
  Plus,
  Stethoscope,
  UserMinus,
  UserPlus,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { useActorUserId } from "@/lib/hooks/use-effective-role";
import { useDemoReady } from "@/lib/hooks/use-demo-ready";
import { formatPkr } from "@/lib/money";
import { serviceName } from "@/lib/display/lookups";
import { withDemoRepo } from "@/lib/store/demo-store";
import * as repo from "@/lib/mock/repository";
import { cn } from "@/lib/utils";
import type { Doctor } from "@/lib/types";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function AdminDoctorsPage() {
  const { ready, state } = useDemoReady();
  const actorUserId = useActorUserId();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [busy, setBusy] = useState(false);

  const [displayName, setDisplayName] = useState("");
  const [title, setTitle] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [bio, setBio] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("doctor123");
  const [serviceId, setServiceId] = useState("");

  const [editName, setEditName] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editDept, setEditDept] = useState("");
  const [editBio, setEditBio] = useState("");
  const [credUser, setCredUser] = useState("");
  const [credPass, setCredPass] = useState("");
  const [svcId, setSvcId] = useState("");
  const [svcDuration, setSvcDuration] = useState("30");
  const [svcFee, setSvcFee] = useState("3000");
  const [svcBuffer, setSvcBuffer] = useState("5");
  const [workDays, setWorkDays] = useState<number[]>([1, 2, 3, 4, 5, 6]);

  const doctors = useMemo(() => {
    if (!state) return [];
    return [...state.doctors].sort((a, b) =>
      a.displayName.localeCompare(b.displayName),
    );
  }, [state]);

  const selected: Doctor | null = useMemo(() => {
    if (!state || !selectedId) return null;
    return state.doctors.find((d) => d.id === selectedId) ?? null;
  }, [state, selectedId]);

  const selectedUser = useMemo(() => {
    if (!state || !selected) return null;
    return state.users.find((u) => u.id === selected.userId) ?? null;
  }, [state, selected]);

  function loadDoctorForm(doc: Doctor) {
    setSelectedId(doc.id);
    setEditName(doc.displayName);
    setEditTitle(doc.title);
    setEditDept(doc.departmentId);
    setEditBio(doc.bio ?? "");
    const user = state?.users.find((u) => u.id === doc.userId);
    setCredUser(user?.username ?? "");
    setCredPass(user?.password ?? "");
    const hours = state?.workingHours.filter((h) => h.doctorId === doc.id) ?? [];
    setWorkDays(
      hours.length ? hours.map((h) => h.dayOfWeek).sort() : [1, 2, 3, 4, 5, 6],
    );
    const firstSvc = state?.doctorServices.find((ds) => ds.doctorId === doc.id);
    setSvcId(firstSvc?.serviceId ?? state?.services[0]?.id ?? "");
    setSvcDuration(String(firstSvc?.durationMinutes ?? 30));
    setSvcFee(String(((firstSvc?.feePaisa ?? 300000) / 100).toFixed(0)));
    setSvcBuffer(String(firstSvc?.bufferMinutes ?? 5));
  }

  async function run(action: () => Promise<void>, okTitle: string) {
    if (!actorUserId || busy) return;
    setBusy(true);
    try {
      await action();
      toast({ title: okTitle });
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

  if (!ready || !state) {
    return <p className="text-sm text-muted">Loading doctors…</p>;
  }

  if (!departmentId && state.departments[0]) {
    // deferred set via render-safe default on first open
  }

  const deptDefault = departmentId || state.departments[0]?.id || "";
  const svcDefault = serviceId || state.services[0]?.id || "";

  return (
    <div className="space-y-6">
      <header className="relative overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(15,118,110,0.14),_transparent_55%)]"
          aria-hidden
        />
        <div className="relative flex flex-col gap-4 p-5 sm:flex-row sm:items-end sm:justify-between sm:p-6">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
              Admin control
            </p>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Doctors
            </h1>
            <p className="text-sm text-muted">
              Create profiles, assign logins, manage services and hours
            </p>
          </div>
          <Button
            type="button"
            className="gap-2"
            onClick={() => {
              setShowCreate((v) => !v);
              setDepartmentId(state.departments[0]?.id ?? "");
              setServiceId(state.services[0]?.id ?? "");
            }}
          >
            <Plus className="size-4" aria-hidden />
            {showCreate ? "Close form" : "Add doctor"}
          </Button>
        </div>
      </header>

      {showCreate ? (
        <section className="space-y-4 rounded-2xl border border-primary/20 bg-surface p-4 shadow-sm sm:p-5">
          <div className="flex items-center gap-2">
            <UserPlus className="size-5 text-primary" aria-hidden />
            <h2 className="text-lg font-semibold">New doctor profile</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="doc-name">Display name</Label>
              <Input
                id="doc-name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Dr. Example Name"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="doc-title">Title</Label>
              <Input
                id="doc-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Consultant…"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Department</Label>
              <Select
                value={deptDefault}
                onValueChange={setDepartmentId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  {state.departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Initial service (optional)</Label>
              <Select value={svcDefault} onValueChange={setServiceId}>
                <SelectTrigger>
                  <SelectValue placeholder="Service" />
                </SelectTrigger>
                <SelectContent>
                  {state.services.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="doc-user">Username</Label>
              <Input
                id="doc-user"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="doctor.example"
                autoComplete="off"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="doc-pass">Password</Label>
              <Input
                id="doc-pass"
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="off"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="doc-bio">Bio</Label>
              <Textarea
                id="doc-bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          <Button
            type="button"
            disabled={busy || !actorUserId}
            onClick={() =>
              void run(async () => {
                const created = await withDemoRepo((a) =>
                  repo.createDoctor(a, {
                    displayName,
                    title,
                    departmentId: deptDefault,
                    bio,
                    username,
                    password,
                    actorUserId: actorUserId!,
                    serviceId: svcDefault || undefined,
                    durationMinutes: 30,
                    feePaisa: 300000,
                    bufferMinutes: 5,
                  }),
                );
                setShowCreate(false);
                setDisplayName("");
                setTitle("");
                setBio("");
                setUsername("");
                setPassword("doctor123");
                loadDoctorForm(created.doctor);
              }, "Doctor created")
            }
          >
            Create doctor + login
          </Button>
        </section>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <section className="space-y-2 rounded-2xl border border-border bg-surface p-3 shadow-sm sm:p-4">
          <h2 className="px-1 text-sm font-semibold uppercase tracking-wide text-muted">
            Directory ({doctors.length})
          </h2>
          <ul className="space-y-2">
            {doctors.map((doc) => {
              const dept = state.departments.find(
                (d) => d.id === doc.departmentId,
              );
              const user = state.users.find((u) => u.id === doc.userId);
              const active = doc.active !== false;
              const isSelected = selectedId === doc.id;
              return (
                <li key={doc.id}>
                  <button
                    type="button"
                    onClick={() => loadDoctorForm(doc)}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-xl border px-3 py-3 text-left transition-all hover:border-primary/30 hover:bg-primary/[0.03]",
                      isSelected
                        ? "border-primary/35 bg-primary/[0.06] shadow-sm"
                        : "border-border bg-background",
                    )}
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Stethoscope className="size-5" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-foreground">
                          {doc.displayName}
                        </p>
                        <Badge variant={active ? "success" : "destructive"}>
                          {active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted">
                        {doc.title} · {dept?.name ?? "—"}
                      </p>
                      <p className="mt-1 text-xs text-muted">
                        Login:{" "}
                        <code className="text-[11px]">
                          {user?.username ?? "—"}
                        </code>
                      </p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="space-y-4 rounded-2xl border border-border bg-surface p-4 shadow-sm sm:p-5">
          {!selected ? (
            <p className="py-12 text-center text-sm text-muted">
              Select a doctor to edit profile, login, services, and hours.
            </p>
          ) : (
            <>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">
                    {selected.displayName}
                  </h2>
                  <p className="text-sm text-muted">{selected.title}</p>
                </div>
                <Button
                  type="button"
                  variant={
                    selected.active !== false ? "destructive" : "secondary"
                  }
                  size="sm"
                  className="gap-1.5"
                  disabled={busy || !actorUserId}
                  onClick={() =>
                    void run(async () => {
                      const nextActive = selected.active === false;
                      await withDemoRepo((a) =>
                        repo.setDoctorActive(a, {
                          doctorId: selected.id,
                          active: nextActive,
                          actorUserId: actorUserId!,
                        }),
                      );
                    }, selected.active !== false
                      ? "Doctor deactivated"
                      : "Doctor reactivated")
                  }
                >
                  {selected.active !== false ? (
                    <>
                      <UserMinus className="size-4" aria-hidden />
                      Deactivate
                    </>
                  ) : (
                    <>
                      <UserPlus className="size-4" aria-hidden />
                      Reactivate
                    </>
                  )}
                </Button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Display name</Label>
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Title</Label>
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Department</Label>
                  <Select value={editDept} onValueChange={setEditDept}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {state.departments.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Bio</Label>
                  <Textarea
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    rows={2}
                  />
                </div>
              </div>
              <Button
                type="button"
                variant="secondary"
                disabled={busy || !actorUserId}
                onClick={() =>
                  void run(async () => {
                    await withDemoRepo((a) =>
                      repo.updateDoctor(a, {
                        doctorId: selected.id,
                        actorUserId: actorUserId!,
                        displayName: editName,
                        title: editTitle,
                        departmentId: editDept,
                        bio: editBio,
                      }),
                    );
                  }, "Profile saved")
                }
              >
                Save profile
              </Button>

              <div className="rounded-xl border border-border bg-background p-4">
                <div className="mb-3 flex items-center gap-2">
                  <KeyRound className="size-4 text-primary" aria-hidden />
                  <h3 className="text-sm font-semibold">Login assignment</h3>
                </div>
                <p className="mb-3 text-xs text-muted">
                  Demo credentials only — stored in browser state, not secure.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Username</Label>
                    <Input
                      value={credUser}
                      onChange={(e) => setCredUser(e.target.value)}
                      autoComplete="off"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Password</Label>
                    <Input
                      value={credPass}
                      onChange={(e) => setCredPass(e.target.value)}
                      autoComplete="off"
                    />
                  </div>
                </div>
                <p className="mt-2 text-xs text-muted">
                  Current:{" "}
                  <code>
                    {selectedUser?.username ?? "—"} /{" "}
                    {selectedUser?.password ?? "(none)"}
                  </code>
                </p>
                <Button
                  type="button"
                  className="mt-3"
                  size="sm"
                  disabled={busy || !actorUserId}
                  onClick={() =>
                    void run(async () => {
                      await withDemoRepo((a) =>
                        repo.assignDoctorCredentials(a, {
                          doctorId: selected.id,
                          username: credUser,
                          password: credPass,
                          actorUserId: actorUserId!,
                        }),
                      );
                    }, "Login updated")
                  }
                >
                  Assign username & password
                </Button>
              </div>

              <div className="rounded-xl border border-border bg-background p-4">
                <h3 className="mb-3 text-sm font-semibold">Services & fees</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Service</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Fee</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {state.doctorServices
                      .filter((ds) => ds.doctorId === selected.id)
                      .map((ds) => (
                        <TableRow key={ds.id}>
                          <TableCell>
                            {serviceName(state, ds.serviceId)}
                          </TableCell>
                          <TableCell>{ds.durationMinutes} min</TableCell>
                          <TableCell>{formatPkr(ds.feePaisa)}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
                <div className="mt-3 grid gap-2 sm:grid-cols-4">
                  <Select value={svcId} onValueChange={setSvcId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Service" />
                    </SelectTrigger>
                    <SelectContent>
                      {state.services.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    value={svcDuration}
                    onChange={(e) => setSvcDuration(e.target.value)}
                    placeholder="Minutes"
                  />
                  <Input
                    value={svcFee}
                    onChange={(e) => setSvcFee(e.target.value)}
                    placeholder="Fee PKR"
                  />
                  <Input
                    value={svcBuffer}
                    onChange={(e) => setSvcBuffer(e.target.value)}
                    placeholder="Buffer"
                  />
                </div>
                <Button
                  type="button"
                  size="sm"
                  className="mt-3"
                  variant="secondary"
                  disabled={busy || !actorUserId || !svcId}
                  onClick={() =>
                    void run(async () => {
                      const feePaisa = Math.round(
                        Number.parseFloat(svcFee || "0") * 100,
                      );
                      await withDemoRepo((a) =>
                        repo.upsertDoctorService(a, {
                          doctorId: selected.id,
                          serviceId: svcId,
                          durationMinutes: Number.parseInt(svcDuration, 10) || 30,
                          feePaisa: Number.isFinite(feePaisa) ? feePaisa : 0,
                          bufferMinutes: Number.parseInt(svcBuffer, 10) || 5,
                          actorUserId: actorUserId!,
                        }),
                      );
                    }, "Service saved")
                  }
                >
                  Save service
                </Button>
              </div>

              <div className="rounded-xl border border-border bg-background p-4">
                <h3 className="mb-3 text-sm font-semibold">Working days</h3>
                <div className="flex flex-wrap gap-2">
                  {DAY_NAMES.map((name, day) => {
                    const on = workDays.includes(day);
                    return (
                      <button
                        key={name}
                        type="button"
                        onClick={() =>
                          setWorkDays((prev) =>
                            on
                              ? prev.filter((d) => d !== day)
                              : [...prev, day].sort(),
                          )
                        }
                        className={cn(
                          "rounded-full px-3 py-1.5 text-xs font-semibold",
                          on
                            ? "bg-primary text-primary-foreground"
                            : "bg-surface text-muted ring-1 ring-border",
                        )}
                      >
                        {name}
                      </button>
                    );
                  })}
                </div>
                <Button
                  type="button"
                  size="sm"
                  className="mt-3"
                  variant="secondary"
                  disabled={busy || !actorUserId}
                  onClick={() =>
                    void run(async () => {
                      await withDemoRepo((a) =>
                        repo.setDoctorWorkingHours(a, {
                          doctorId: selected.id,
                          actorUserId: actorUserId!,
                          days: workDays.map((dayOfWeek) => ({
                            dayOfWeek,
                            startTime: "09:00",
                            endTime: "17:00",
                          })),
                        }),
                      );
                    }, "Working hours saved")
                  }
                >
                  Save working hours
                </Button>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
