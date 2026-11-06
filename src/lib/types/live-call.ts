import type { BookingOutcome, DemoLocale } from "@/lib/types";

export type LiveCallPhase = "ringing" | "live" | "ended";

export type CallProcessStepId =
  | "received"
  | "greeting"
  | "language_detected"
  | "collecting_intent"
  | "checking_availability"
  | "outcome"
  | "wrapping_up";

export interface CallProcessStep {
  id: CallProcessStepId;
  label: string;
  detail?: string;
  completedAt?: string;
}

export interface LiveCallSession {
  id: string;
  phase: LiveCallPhase;
  callerName: string;
  callerNumber: string;
  language: DemoLocale;
  requestedDoctorId?: string;
  requestedServiceId?: string;
  bookingOutcome: BookingOutcome;
  forwardedToAdmin: boolean;
  patientLine: string;
  aiLine: string;
  summary: string;
  startedAt: string;
  acceptedAt?: string;
  endedAt?: string;
  currentStepIndex: number;
  steps: CallProcessStep[];
  livePatientTranscript: string;
  liveAiTranscript: string;
}

export const CALL_PROCESS_STEP_ORDER: CallProcessStepId[] = [
  "received",
  "greeting",
  "language_detected",
  "collecting_intent",
  "checking_availability",
  "outcome",
  "wrapping_up",
];
