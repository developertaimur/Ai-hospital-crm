import type { BookingOutcome, DemoLocale } from "@/lib/types";
import type { CallProcessStep } from "@/lib/types/live-call";

export interface IncomingCallScript {
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
  stepDetails: Partial<Record<CallProcessStep["id"], string>>;
}

export const INCOMING_CALL_SCRIPTS: IncomingCallScript[] = [
  {
    callerName: "Nadia Sheikh",
    callerNumber: "0301-7788990",
    language: "en",
    requestedDoctorId: "doc-ahmed",
    requestedServiceId: "svc-consult-cardio",
    bookingOutcome: "provisional_reservation",
    forwardedToAdmin: false,
    patientLine:
      "Hi — I need a cardiology consult this week. Can you hold a slot for me?",
    aiLine:
      "I’ve placed a provisional hold with Dr. Ahmed Hassan. Admin will confirm after payment verification.",
    summary:
      "Caller requested cardiology consult. AI created a provisional reservation and explained payment confirmation is Admin-only.",
    stepDetails: {
      greeting: "AI receptionist answered in English",
      language_detected: "English",
      collecting_intent: "Cardiology consultation · Dr. Ahmed Hassan",
      checking_availability: "Matching open demo slots",
      outcome: "Provisional reservation created (demo)",
    },
  },
  {
    callerName: "Usman Tariq",
    callerNumber: "0345-2211009",
    language: "ur",
    requestedDoctorId: "doc-fatima",
    requestedServiceId: "svc-consult-gp",
    bookingOutcome: "callback_requested",
    forwardedToAdmin: true,
    patientLine:
      "Mujhe GP slot chahiye lekin insurance clear nahi — koi wapas call kare?",
    aiLine:
      "Samajh gaya. Booking hold nahi ki — callback Admin queue ko forward kar di hai.",
    summary:
      "Urdu caller asked for GP availability with unclear insurance. No booking; callback forwarded to Admin.",
    stepDetails: {
      greeting: "AI receptionist answered in Urdu",
      language_detected: "Urdu",
      collecting_intent: "General medicine · insurance unclear",
      checking_availability: "Insurance panel not resolvable in demo",
      outcome: "Callback requested · forwarded to Admin",
    },
  },
  {
    callerName: "Unknown caller",
    callerNumber: "0312-4455660",
    language: "en",
    bookingOutcome: "abandoned",
    forwardedToAdmin: false,
    patientLine: "Hello…? (silence)",
    aiLine: "Hello, Life Care International Hospital AI receptionist. Are you still there?",
    summary: "Short abandoned inbound call — no intent captured, no booking.",
    stepDetails: {
      greeting: "AI receptionist answered",
      language_detected: "English (assumed)",
      collecting_intent: "No response from caller",
      checking_availability: "Skipped",
      outcome: "Call abandoned",
    },
  },
  {
    callerName: "Maryam Gul",
    callerNumber: "0333-9090112",
    language: "en",
    requestedDoctorId: "doc-sana",
    requestedServiceId: "svc-consult-derm",
    bookingOutcome: "forwarded_to_admin",
    forwardedToAdmin: true,
    patientLine:
      "I already left a dermatology callback — please have Admin call about evening slots.",
    aiLine:
      "Noted. No new provisional hold. I’ve forwarded your preference to the Admin callback queue.",
    summary:
      "Returning caller without a new booking. Request forwarded to Admin for evening dermatology slots.",
    stepDetails: {
      greeting: "AI receptionist answered",
      language_detected: "English",
      collecting_intent: "Dermatology · evening slots · existing callback",
      checking_availability: "Deferred to Admin callback handling",
      outcome: "Forwarded to Admin",
    },
  },
];

export function buildInitialSteps(
  script: IncomingCallScript,
): CallProcessStep[] {
  return [
    {
      id: "received",
      label: "Call received",
      detail: `${script.callerName} · ${script.callerNumber}`,
    },
    {
      id: "greeting",
      label: "AI greeting",
      detail: script.stepDetails.greeting,
    },
    {
      id: "language_detected",
      label: "Language detected",
      detail: script.stepDetails.language_detected,
    },
    {
      id: "collecting_intent",
      label: "Collecting intent",
      detail: script.stepDetails.collecting_intent,
    },
    {
      id: "checking_availability",
      label: "Checking availability",
      detail: script.stepDetails.checking_availability,
    },
    {
      id: "outcome",
      label: "Outcome",
      detail: script.stepDetails.outcome,
    },
    {
      id: "wrapping_up",
      label: "Wrapping up",
      detail: "Closing call and writing demo summary",
    },
  ];
}
