import type { Appointment, DemoState } from "@/lib/types";
import { id } from "@/lib/utils";

/**
 * Expire awaiting_payment reservations whose expiresAt <= now.
 * Never expires confirmed appointments. Partial verified amounts flag for human resolution.
 */
export function reconcileExpiredReservations(
  state: DemoState,
  now: Date,
): DemoState {
  const nowIso = now.toISOString();
  let changed = false;
  const activityEvents = [...state.activityEvents];

  const appointments = state.appointments.map((apt) => {
    if (apt.status !== "awaiting_payment") return apt;
    if (!apt.expiresAt) return apt;
    if (apt.expiresAt > nowIso) return apt;

    changed = true;
    const requiresPaymentResolution = apt.verifiedAmountPaisa > 0;
    const updated: Appointment = {
      ...apt,
      status: "expired",
      expiresAt: undefined,
      paymentStatus:
        apt.verifiedAmountPaisa > 0 ? "review_required" : apt.paymentStatus,
      requiresPaymentResolution,
      updatedAt: nowIso,
    };

    activityEvents.unshift({
      id: id("act"),
      type: "appointment_expired",
      message: requiresPaymentResolution
        ? `Reservation expired with partial payment (PKR ${apt.verifiedAmountPaisa / 100}) — needs resolution`
        : "Reservation expired (unpaid)",
      entityType: "appointment",
      entityId: apt.id,
      createdAt: nowIso,
    });

    return updated;
  });

  if (!changed) return state;

  return {
    ...state,
    appointments,
    activityEvents,
  };
}
