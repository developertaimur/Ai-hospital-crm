import type { DemoState } from "@/lib/types";

export function patientName(state: DemoState, patientId: string): string {
  return state.patients.find((p) => p.id === patientId)?.fullName ?? "Unknown patient";
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
