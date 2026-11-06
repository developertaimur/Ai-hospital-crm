import type {
  BookingOutcome,
  CallRecord,
  CallbackRequest,
  DemoState,
  Patient,
} from "@/lib/types";

const BOOKING_OUTCOME_LABELS: Record<BookingOutcome, string> = {
  none: "No booking",
  provisional_reservation: "Provisional reservation",
  confirmed: "Confirmed booking",
  forwarded_to_admin: "Forwarded to Admin",
  callback_requested: "Callback requested",
  abandoned: "Abandoned",
};

export function bookingOutcomeLabel(outcome?: BookingOutcome): string {
  if (!outcome) return "—";
  return BOOKING_OUTCOME_LABELS[outcome] ?? outcome;
}

export function callerDisplayName(
  state: DemoState,
  call: CallRecord,
): string {
  if (call.callerName) return call.callerName;
  if (call.patientId) return patientName(state, call.patientId);
  return "Unknown caller";
}

export function callerDisplayNumber(
  state: DemoState,
  call: CallRecord,
): string {
  if (call.callerNumber) return call.callerNumber;
  if (call.patientId) {
    const p = getPatient(state, call.patientId);
    return p?.phoneNational ?? p?.phoneE164 ?? "—";
  }
  return "—";
}

export function patientName(state: DemoState, patientId: string): string {
  return state.patients.find((p) => p.id === patientId)?.fullName ?? "Unknown patient";
}

export function getPatient(
  state: DemoState,
  patientId: string,
): Patient | undefined {
  return state.patients.find((p) => p.id === patientId);
}

export function doctorName(state: DemoState, doctorId: string): string {
  return state.doctors.find((d) => d.id === doctorId)?.displayName ?? "Unknown doctor";
}

export function serviceName(state: DemoState, serviceId: string): string {
  return state.services.find((s) => s.id === serviceId)?.name ?? "Unknown service";
}

export function userDisplayName(state: DemoState, userId: string): string {
  return state.users.find((u) => u.id === userId)?.displayName ?? userId;
}

export function bookingRef(appointmentId: string): string {
  return appointmentId.replace(/^apt-/, "").slice(-8).toUpperCase();
}

/** Match call by appointment ID (not patient name). */
export function findCallForAppointment(
  state: DemoState,
  appointmentId: string,
): CallRecord | undefined {
  return state.callRecords.find((c) => c.appointmentId === appointmentId);
}

/** Match callback by appointment ID (not patient name). */
export function findCallbackForAppointment(
  state: DemoState,
  appointmentId: string,
): CallbackRequest | undefined {
  return state.callbacks.find((c) => c.appointmentId === appointmentId);
}

export function formatCallDuration(seconds?: number): string {
  if (seconds == null || !Number.isFinite(seconds) || seconds < 0) {
    return "—";
  }
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  if (m <= 0) return `${s}s`;
  return `${m}m ${String(s).padStart(2, "0")}s`;
}
