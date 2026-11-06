"use client";

import { useEffect, useState } from "react";
import {
  Bot,
  CheckCircle2,
  Circle,
  PhoneOff,
  Radio,
  UserRound,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  bookingOutcomeLabel,
  doctorName,
  formatCallDuration,
  serviceName,
} from "@/lib/display/lookups";
import { useLiveCallStore } from "@/lib/store/live-call-store";
import { cn } from "@/lib/utils";
import type { DemoState } from "@/lib/types";

interface LiveCallPanelProps {
  state: DemoState;
}

export function LiveCallPanel({ state }: LiveCallPanelProps) {
  const live = useLiveCallStore((s) => s.live);
  const advanceLiveStep = useLiveCallStore((s) => s.advanceLiveStep);
  const endLiveCall = useLiveCallStore((s) => s.endLiveCall);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const liveId = live?.id;
  const livePhase = live?.phase;
  const acceptedAt = live?.acceptedAt;

  useEffect(() => {
    if (!liveId) return;
    const tick = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(tick);
  }, [liveId]);

  useEffect(() => {
    if (!liveId || livePhase !== "live") return;
    const timer = window.setInterval(() => {
      advanceLiveStep();
    }, 3200);
    return () => window.clearInterval(timer);
  }, [liveId, livePhase, advanceLiveStep]);

  if (!live) return null;

  const startMs = acceptedAt ? Date.parse(acceptedAt) : NaN;
  const elapsedSeconds = Number.isFinite(startMs)
    ? Math.max(0, Math.round((nowMs - startMs) / 1000))
    : 0;

  const currentStep = live.steps[live.currentStepIndex];

  return (
    <section
      aria-label="Live call"
      className="overflow-hidden rounded-2xl border border-primary/25 bg-surface shadow-md shadow-primary/10"
    >
      <div className="flex flex-col gap-3 border-b border-primary/15 bg-primary/[0.06] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex items-center gap-3">
          <span className="relative flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <span className="absolute inset-0 animate-ping rounded-full bg-primary/30" />
            <Radio className="relative size-5" aria-hidden />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold text-foreground">Live now</h2>
              <Badge variant="success">Connected</Badge>
            </div>
            <p className="text-sm text-muted">
              {live.callerName} ·{" "}
              <span className="tabular-nums">{live.callerNumber}</span> ·{" "}
              {formatCallDuration(elapsedSeconds)}
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          className="gap-1.5 self-start sm:self-auto"
          onClick={() => endLiveCall()}
        >
          <PhoneOff className="size-4" aria-hidden />
          End call
        </Button>
      </div>

      <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Call process
          </p>
          <ol className="space-y-2">
            {live.steps.map((step, index) => {
              const done = index < live.currentStepIndex || !!step.completedAt;
              const current = index === live.currentStepIndex;
              return (
                <li
                  key={step.id}
                  className={cn(
                    "flex items-start gap-2.5 rounded-xl border px-3 py-2.5 text-sm transition-colors",
                    current
                      ? "border-primary/30 bg-primary/[0.06]"
                      : done
                        ? "border-border bg-background"
                        : "border-dashed border-border bg-background/60 text-muted",
                  )}
                >
                  {done && !current ? (
                    <CheckCircle2
                      className="mt-0.5 size-4 shrink-0 text-success"
                      aria-hidden
                    />
                  ) : (
                    <Circle
                      className={cn(
                        "mt-0.5 size-4 shrink-0",
                        current ? "text-primary" : "text-muted",
                      )}
                      aria-hidden
                    />
                  )}
                  <div className="min-w-0">
                    <p
                      className={cn(
                        "font-medium",
                        current ? "text-primary" : "text-foreground",
                      )}
                    >
                      {step.label}
                      {current ? " · in progress" : null}
                    </p>
                    {step.detail ? (
                      <p className="mt-0.5 text-xs text-muted">{step.detail}</p>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

        <div className="space-y-3">
          <div className="rounded-xl border border-border bg-background p-3 text-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Current step
            </p>
            <p className="mt-1 font-medium text-foreground">
              {currentStep?.label ?? "—"}
            </p>
            <p className="mt-1 text-xs text-muted">
              Outcome preview: {bookingOutcomeLabel(live.bookingOutcome)}
              {live.forwardedToAdmin ? " · Forward to Admin" : ""}
            </p>
            {(live.requestedDoctorId || live.requestedServiceId) && (
              <p className="mt-2 text-xs text-muted">
                Requested:{" "}
                {live.requestedDoctorId
                  ? doctorName(state, live.requestedDoctorId)
                  : "—"}
                {" · "}
                {live.requestedServiceId
                  ? serviceName(state, live.requestedServiceId)
                  : "—"}
              </p>
            )}
          </div>

          <div className="space-y-2 rounded-xl border border-border bg-background p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Live transcript (demo)
            </p>
            <div className="rounded-lg bg-surface p-2.5 text-sm">
              <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-muted">
                <UserRound className="size-3.5" aria-hidden />
                Patient
              </p>
              <p className="whitespace-pre-wrap text-foreground">
                {live.livePatientTranscript || "Waiting for caller…"}
              </p>
            </div>
            <div className="rounded-lg bg-surface p-2.5 text-sm">
              <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-muted">
                <Bot className="size-3.5" aria-hidden />
                AI receptionist
              </p>
              <p className="whitespace-pre-wrap text-foreground">
                {live.liveAiTranscript || "Listening…"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
