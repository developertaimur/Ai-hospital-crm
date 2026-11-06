"use client";

import { create } from "zustand";
import {
  buildInitialSteps,
  INCOMING_CALL_SCRIPTS,
  type IncomingCallScript,
} from "@/lib/mock/live-call-scripts";
import type { CallRecord } from "@/lib/types";
import type { LiveCallSession } from "@/lib/types/live-call";
import { getDemoNow } from "@/lib/time";
import { id } from "@/lib/utils";
import { useDemoStore } from "@/lib/store/demo-store";

interface LiveCallStore {
  ringing: LiveCallSession | null;
  live: LiveCallSession | null;
  scriptCursor: number;
  simulateIncomingCall: (script?: IncomingCallScript) => LiveCallSession | null;
  acceptRingingCall: () => LiveCallSession | null;
  dismissRingingCall: () => void;
  advanceLiveStep: () => void;
  endLiveCall: () => CallRecord | null;
  clearAll: () => void;
}

function nowIso(): string {
  return getDemoNow().toISOString();
}

function sessionFromScript(
  script: IncomingCallScript,
  phase: "ringing" | "live",
): LiveCallSession {
  const startedAt = nowIso();
  const steps = buildInitialSteps(script).map((step, index) =>
    index === 0 && phase === "ringing"
      ? { ...step, completedAt: startedAt }
      : step,
  );
  return {
    id: id("livecall"),
    phase,
    callerName: script.callerName,
    callerNumber: script.callerNumber,
    language: script.language,
    requestedDoctorId: script.requestedDoctorId,
    requestedServiceId: script.requestedServiceId,
    bookingOutcome: script.bookingOutcome,
    forwardedToAdmin: script.forwardedToAdmin,
    patientLine: script.patientLine,
    aiLine: script.aiLine,
    summary: script.summary,
    startedAt,
    acceptedAt: phase === "live" ? startedAt : undefined,
    currentStepIndex: 0,
    steps,
    livePatientTranscript: "",
    liveAiTranscript: "",
  };
}

function toCallRecord(session: LiveCallSession, abandoned: boolean): CallRecord {
  const endedAt = nowIso();
  const startMs = Date.parse(session.acceptedAt ?? session.startedAt);
  const endMs = Date.parse(endedAt);
  const durationSeconds = Number.isFinite(startMs)
    ? Math.max(1, Math.round((endMs - startMs) / 1000))
    : 30;

  return {
    id: id("call"),
    callerName: session.callerName,
    callerNumber: session.callerNumber,
    direction: "inbound",
    startedAt: session.acceptedAt ?? session.startedAt,
    endedAt,
    durationSeconds: abandoned ? Math.min(durationSeconds, 25) : durationSeconds,
    language: session.language,
    summary: abandoned
      ? "Incoming call dismissed before accept (demo)."
      : session.summary,
    patientTranscript: abandoned
      ? undefined
      : session.livePatientTranscript || session.patientLine,
    aiTranscript: abandoned
      ? undefined
      : session.liveAiTranscript || session.aiLine,
    requestedDoctorId: abandoned ? undefined : session.requestedDoctorId,
    requestedServiceId: abandoned ? undefined : session.requestedServiceId,
    bookingOutcome: abandoned ? "abandoned" : session.bookingOutcome,
    forwardedToAdmin: abandoned ? false : session.forwardedToAdmin,
  };
}

function appendCallRecord(record: CallRecord): void {
  const demo = useDemoStore.getState();
  if (!demo.state) return;
  demo.applyState({
    ...demo.state,
    callRecords: [record, ...demo.state.callRecords],
  });
}

function withTranscriptProgress(session: LiveCallSession): LiveCallSession {
  const step = session.steps[session.currentStepIndex];
  let patient = session.livePatientTranscript;
  let ai = session.liveAiTranscript;

  if (step?.id === "collecting_intent" && !patient) {
    patient = session.patientLine;
  }
  if (
    (step?.id === "outcome" || step?.id === "wrapping_up") &&
    !ai
  ) {
    ai = session.aiLine;
  }

  return {
    ...session,
    livePatientTranscript: patient,
    liveAiTranscript: ai,
  };
}

export const useLiveCallStore = create<LiveCallStore>((set, get) => ({
  ringing: null,
  live: null,
  scriptCursor: 0,

  simulateIncomingCall: (script) => {
    const { ringing, live, scriptCursor } = get();
    if (ringing || live) return null;

    const chosen =
      script ??
      INCOMING_CALL_SCRIPTS[scriptCursor % INCOMING_CALL_SCRIPTS.length]!;
    const session = sessionFromScript(chosen, "ringing");
    set({
      ringing: session,
      scriptCursor: scriptCursor + 1,
    });
    return session;
  },

  acceptRingingCall: () => {
    const { ringing } = get();
    if (!ringing) return null;
    const acceptedAt = nowIso();
    const live: LiveCallSession = {
      ...ringing,
      phase: "live",
      acceptedAt,
      currentStepIndex: 1,
      steps: ringing.steps.map((step, index) =>
        index === 0
          ? { ...step, completedAt: step.completedAt ?? ringing.startedAt }
          : step,
      ),
    };
    set({ ringing: null, live });
    return live;
  },

  dismissRingingCall: () => {
    const { ringing } = get();
    if (!ringing) return;
    appendCallRecord(toCallRecord(ringing, true));
    set({ ringing: null });
  },

  advanceLiveStep: () => {
    const { live } = get();
    if (!live || live.phase !== "live") return;

    const nextIndex = live.currentStepIndex + 1;
    if (nextIndex >= live.steps.length) {
      get().endLiveCall();
      return;
    }

    const stamped = nowIso();
    const steps = live.steps.map((step, index) =>
      index === nextIndex ? { ...step, completedAt: stamped } : step,
    );
    const progressed = withTranscriptProgress({
      ...live,
      currentStepIndex: nextIndex,
      steps,
    });
    set({ live: progressed });

    if (nextIndex === live.steps.length - 1) {
      window.setTimeout(() => {
        const current = get().live;
        if (current && current.id === progressed.id) {
          get().endLiveCall();
        }
      }, 1800);
    }
  },

  endLiveCall: () => {
    const { live } = get();
    if (!live) return null;
    const record = toCallRecord(
      {
        ...live,
        phase: "ended",
        endedAt: nowIso(),
        livePatientTranscript:
          live.livePatientTranscript || live.patientLine,
        liveAiTranscript: live.liveAiTranscript || live.aiLine,
      },
      false,
    );
    appendCallRecord(record);
    set({ live: null });
    return record;
  },

  clearAll: () => set({ ringing: null, live: null }),
}));
