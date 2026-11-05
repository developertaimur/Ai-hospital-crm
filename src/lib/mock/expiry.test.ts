import { afterEach, describe, expect, it } from "vitest";
import { reconcileExpiredReservations } from "@/lib/mock/expiry";
import { createSeedState } from "@/lib/mock/seed";
import { addMinutesIso, getDemoNow, resetDemoClock } from "@/lib/time";

describe("reconcileExpiredReservations", () => {
  afterEach(() => {
    resetDemoClock();
  });

  it("expires unpaid awaiting_payment reservations past expiresAt", () => {
    const now = getDemoNow();
    const state = createSeedState(now);
    const apt = state.appointments.find(
      (a) => a.status === "awaiting_payment" && a.verifiedAmountPaisa === 0,
    )!;
    const past = addMinutesIso(apt.expiresAt!, 1);
    const reconciled = reconcileExpiredReservations(state, new Date(past));
    const updated = reconciled.appointments.find((a) => a.id === apt.id)!;
    expect(updated.status).toBe("expired");
    expect(updated.expiresAt).toBeUndefined();
  });

  it("never expires confirmed appointments", () => {
    const now = getDemoNow();
    const state = createSeedState(now);
    const confirmed = state.appointments.find((a) => a.status === "confirmed")!;
    const farFuture = addMinutesIso(now.toISOString(), 60 * 24 * 365);
    const reconciled = reconcileExpiredReservations(
      state,
      new Date(farFuture),
    );
    const updated = reconciled.appointments.find((a) => a.id === confirmed.id)!;
    expect(updated.status).toBe("confirmed");
  });
});
