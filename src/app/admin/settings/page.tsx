"use client";

import { useState } from "react";
import { Bot, Save } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { useActorUserId } from "@/lib/hooks/use-effective-role";
import { useDemoReady } from "@/lib/hooks/use-demo-ready";
import { withDemoRepo } from "@/lib/store/demo-store";
import * as repo from "@/lib/mock/repository";
import type {
  AiChangePolicy,
  DemoLocale,
  HospitalSettings,
} from "@/lib/types";

function SettingsForm({
  initial,
  actorUserId,
}: {
  initial: HospitalSettings;
  actorUserId?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [hospitalName, setHospitalName] = useState(initial.hospitalName);
  const [location, setLocation] = useState(initial.locationPlaceholder);
  const [timezone, setTimezone] = useState(initial.timezone);
  const [transferPhone, setTransferPhone] = useState(
    initial.transferPhoneNumber ?? "",
  );
  const [escalation, setEscalation] = useState(
    initial.clinicalEscalationContact ?? "",
  );
  const [aiPolicy, setAiPolicy] = useState<AiChangePolicy>(
    initial.aiChangePolicy,
  );
  const [expiryMinutes, setExpiryMinutes] = useState(
    String(initial.defaultReservationExpiryMinutes),
  );
  const [aiEnabled, setAiEnabled] = useState(
    initial.aiReceptionEnabled !== false,
  );
  const [aiLanguage, setAiLanguage] = useState<DemoLocale>(
    initial.aiDefaultLanguage ?? "en",
  );
  const [aiGreeting, setAiGreeting] = useState(initial.aiGreetingNote ?? "");

  async function save() {
    if (!actorUserId || busy) return;
    setBusy(true);
    try {
      await withDemoRepo((a) =>
        repo.updateSettings(
          a,
          {
            hospitalName:
              hospitalName.trim() || "Life Care International Hospital",
            locationPlaceholder: location.trim(),
            timezone: timezone.trim() || "Asia/Karachi",
            transferPhoneNumber: transferPhone.trim() || null,
            clinicalEscalationContact: escalation.trim() || null,
            aiChangePolicy: aiPolicy,
            defaultReservationExpiryMinutes:
              Number.parseInt(expiryMinutes, 10) || 60,
            aiReceptionEnabled: aiEnabled,
            aiDefaultLanguage: aiLanguage,
            aiGreetingNote: aiGreeting.trim() || undefined,
          },
          actorUserId,
        ),
      );
      toast({ title: "Settings saved" });
    } catch (e) {
      toast({
        title: "Could not save settings",
        description: e instanceof Error ? e.message : undefined,
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="space-y-4 rounded-2xl border border-border bg-surface p-4 shadow-sm sm:p-5">
        <h2 className="text-lg font-semibold">Hospital</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="set-name">Hospital name</Label>
            <Input
              id="set-name"
              value={hospitalName}
              onChange={(e) => setHospitalName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="set-loc">Location</Label>
            <Input
              id="set-loc"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="set-tz">Timezone</Label>
            <Input
              id="set-tz"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="set-expiry">Reservation expiry (minutes)</Label>
            <Input
              id="set-expiry"
              type="number"
              min={5}
              value={expiryMinutes}
              onChange={(e) => setExpiryMinutes(e.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-border bg-surface p-4 shadow-sm sm:p-5">
        <div className="flex items-center gap-2">
          <Bot className="size-5 text-primary" aria-hidden />
          <h2 className="text-lg font-semibold">AI receptionist</h2>
          <Badge variant={aiEnabled ? "success" : "secondary"}>
            {aiEnabled ? "Enabled" : "Disabled"}
          </Badge>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>AI reception enabled</Label>
            <Select
              value={aiEnabled ? "on" : "off"}
              onValueChange={(v) => setAiEnabled(v === "on")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="on">Enabled</SelectItem>
                <SelectItem value="off">Disabled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Default language</Label>
            <Select
              value={aiLanguage}
              onValueChange={(v) => setAiLanguage(v as DemoLocale)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="ur">Urdu</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>AI change policy</Label>
            <Select
              value={aiPolicy}
              onValueChange={(v) => setAiPolicy(v as AiChangePolicy)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending_configuration">
                  Pending configuration
                </SelectItem>
                <SelectItem value="require_approval">Require approval</SelectItem>
                <SelectItem value="auto_apply">Auto apply</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="set-transfer">Transfer phone</Label>
            <Input
              id="set-transfer"
              value={transferPhone}
              onChange={(e) => setTransferPhone(e.target.value)}
              placeholder="+92…"
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="set-esc">Clinical escalation contact</Label>
            <Input
              id="set-esc"
              value={escalation}
              onChange={(e) => setEscalation(e.target.value)}
              placeholder="Name / number"
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="set-greet">AI greeting note</Label>
            <Textarea
              id="set-greet"
              value={aiGreeting}
              onChange={(e) => setAiGreeting(e.target.value)}
              rows={3}
            />
          </div>
        </div>
      </section>

      <Button
        type="button"
        className="gap-2"
        disabled={busy || !actorUserId}
        onClick={() => void save()}
      >
        <Save className="size-4" aria-hidden />
        {busy ? "Saving…" : "Save settings"}
      </Button>
    </div>
  );
}

export default function AdminSettingsPage() {
  const { ready, state } = useDemoReady();
  const actorUserId = useActorUserId();

  if (!ready || !state) {
    return <p className="text-sm text-muted">Loading settings…</p>;
  }

  return (
    <div className="space-y-6">
      <header className="relative overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(15,118,110,0.14),_transparent_55%)]"
          aria-hidden
        />
        <div className="relative space-y-2 p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
            Admin control
          </p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Settings
          </h1>
          <p className="text-sm text-muted">
            Hospital profile and AI receptionist controls
          </p>
        </div>
      </header>

      <SettingsForm
        key={state.schemaVersion}
        initial={state.hospitalSettings}
        actorUserId={actorUserId}
      />
    </div>
  );
}
