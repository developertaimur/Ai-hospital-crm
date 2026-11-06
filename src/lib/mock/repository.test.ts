import { afterEach, describe, expect, it } from "vitest";
import {
  createPatientSync,
  createPaymentClaimSync,
  cancelAppointmentSync,
  createReservationSync,
  DemoOperationError,
  getAppointments,
  getAppointmentsSync,
  getAvailableSlotsSync,
  MOCK_DELAY_MS,
  recordVerifiedPaymentSync,
  rescheduleAppointmentSync,
  updateCallbackStatusSync,
} from "@/lib/mock/repository";
import { reconcileExpiredReservations } from "@/lib/mock/expiry";
import { createSeedState } from "@/lib/mock/seed";
import { createInMemoryAdapter } from "@/lib/test/demo-adapter";
import {
  addMinutesIso,
  advanceDemoMinutes,
  getDemoNow,
  resetDemoClock,
  toKarachiDateKey,
} from "@/lib/time";
function pickFutureSlot(
  state: ReturnType<typeof createSeedState>,
  doctorId: string,
  serviceId: string,
): string {
  const now = getDemoNow();
  for (let day = 1; day <= 14; day++) {
    const d = new Date(now);
    d.setDate(d.getDate() + day);
    const dateKey = toKarachiDateKey(d.toISOString());
    const slots = getAvailableSlotsSync(state, {
      doctorId,
      serviceId,
      dateKey,
      now,
    });
    if (slots.length > 0) return slots[0];
  }
  throw new Error("No future slot found for test");
}

describe("repository", () => {
  afterEach(() => {
    resetDemoClock();
  });

  it("filters getAppointments by doctorId", async () => {
    const adapter = createInMemoryAdapter(createSeedState());
    const forAhmed = await getAppointments(adapter, { doctorId: "doc-ahmed" });
    expect(forAhmed.length).toBeGreaterThan(0);
    expect(forAhmed.every((a) => a.doctorId === "doc-ahmed")).toBe(true);

    const syncAll = getAppointmentsSync(adapter.getState());
    expect(forAhmed.length).toBeLessThan(syncAll.length);
  });

  it("returns the same appointment for duplicate clientRequestId", () => {
    const now = getDemoNow();
    const state = createSeedState(now);
    const startIso = pickFutureSlot(state, "doc-fatima", "svc-consult-gp");
    const input = {
      patientId: "pat-1",
      doctorId: "doc-fatima",
      serviceId: "svc-consult-gp",
      scheduledStartIso: startIso,
      clientRequestId: "dup-req-001",
    };
    const first = createReservationSync(state, input, now);
    const second = createReservationSync(first.state, input, now);
    expect(second.result.id).toBe(first.result.id);
    expect(second.state.processedClientRequestIds).toContain("dup-req-001");
  });

  it("uses SMS when patient has no email on reservation", () => {
    const now = getDemoNow();
    const state = createSeedState(now);
    const startIso = pickFutureSlot(state, "doc-ali", "svc-consult-peds");
    const { state: next, result: apt } = createReservationSync(
      state,
      {
        patientId: "pat-3",
        doctorId: "doc-ali",
        serviceId: "svc-consult-peds",
        scheduledStartIso: startIso,
      },
      now,
    );
    const notif = next.notifications.find((n) => n.appointmentId === apt.id);
    expect(notif?.channel).toBe("sms");
  });

  it("uses email channel when patient has an email", () => {
    const now = getDemoNow();
    const state = createSeedState(now);
    const { state: withPatient } = createPatientSync(state, {
      fullName: "Email Patient",
      phone: "03001234999",
      email: "patient@example.com",
    });
    const patient = withPatient.patients[0];
    const startIso = pickFutureSlot(withPatient, "doc-ali", "svc-consult-peds");
    const { state: next, result: apt } = createReservationSync(
      withPatient,
      {
        patientId: patient.id,
        doctorId: "doc-ali",
        serviceId: "svc-consult-peds",
        scheduledStartIso: startIso,
      },
      now,
    );
    const notif = next.notifications.find((n) => n.appointmentId === apt.id);
    expect(notif?.channel).toBe("email");
  });

  it("preserves booking when notification delivery is marked failed", () => {
    const now = getDemoNow();
    const seed = createSeedState(now);
    const startIso = pickFutureSlot(seed, "doc-sana", "svc-consult-derm");
    const { state: booked, result: apt } = createReservationSync(
      seed,
      {
        patientId: "pat-6",
        doctorId: "doc-sana",
        serviceId: "svc-consult-derm",
        scheduledStartIso: startIso,
      },
      now,
    );
    const notifications = booked.notifications.map((n) =>
      n.appointmentId === apt.id
        ? { ...n, status: "failed_simulated" as const, errorMessage: "timeout" }
        : n,
    );
    const state = { ...booked, notifications };
    const stored = state.appointments.find((a) => a.id === apt.id)!;
    expect(stored.status).toBe("awaiting_payment");
  });

  it("confirms and clears expiry when verified payment meets 50% threshold", () => {
    const now = getDemoNow();
    const state = createSeedState(now);
    const startIso = pickFutureSlot(state, "doc-fatima", "svc-consult-gp");
    const fee = state.doctorServices.find(
      (d) => d.doctorId === "doc-fatima" && d.serviceId === "svc-consult-gp",
    )!.feePaisa;
    const { state: booked, result: apt } = createReservationSync(
      state,
      {
        patientId: "pat-1",
        doctorId: "doc-fatima",
        serviceId: "svc-consult-gp",
        scheduledStartIso: startIso,
      },
      now,
    );
    expect(apt.expiresAt).toBeDefined();

    const paid = recordVerifiedPaymentSync(
      booked,
      {
        appointmentId: apt.id,
        amountPaisa: Math.ceil(fee / 2),
        actorUserId: "user-admin",
        method: "cash",
      },
      now,
    );
    expect(paid.result.status).toBe("confirmed");
    expect(paid.result.expiresAt).toBeUndefined();
    expect(paid.result.paymentStatus).toBe("partial");
  });

  it("does not confirm booking from unverified payment claims alone", () => {
    const now = getDemoNow();
    const state = createSeedState(now);
    const awaiting = state.appointments.find(
      (a) => a.status === "awaiting_payment",
    )!;
    const { state: next, result: claim } = createPaymentClaimSync(state, {
      appointmentId: awaiting.id,
      claimedAmountPaisa: awaiting.totalFeePaisa,
    });
    const apt = next.appointments.find((a) => a.id === awaiting.id)!;
    expect(claim.status).toBe("pending_review");
    expect(apt.status).toBe("awaiting_payment");
    expect(apt.verifiedAmountPaisa).toBe(awaiting.verifiedAmountPaisa);
  });

  it("keeps awaiting_payment when verified amount is below 50%", () => {
    const now = getDemoNow();
    const state = createSeedState(now);
    const startIso = pickFutureSlot(state, "doc-khan", "svc-consult-ortho");
    const fee = state.doctorServices.find(
      (d) => d.doctorId === "doc-khan" && d.serviceId === "svc-consult-ortho",
    )!.feePaisa;
    const { state: booked, result: apt } = createReservationSync(
      state,
      {
        patientId: "pat-2",
        doctorId: "doc-khan",
        serviceId: "svc-consult-ortho",
        scheduledStartIso: startIso,
      },
      now,
    );
    const belowHalf = Math.floor(fee * 0.49);
    const paid = recordVerifiedPaymentSync(
      booked,
      {
        appointmentId: apt.id,
        amountPaisa: belowHalf,
        actorUserId: "user-admin",
        method: "bank_transfer",
      },
      now,
    );
    expect(paid.result.status).toBe("awaiting_payment");
    expect(paid.result.paymentStatus).toBe("partial");
    expect(paid.result.expiresAt).toBeDefined();
  });

  it("denies verify_payment to doctor accounts", () => {
    const now = getDemoNow();
    const state = createSeedState(now);
    const awaiting = state.appointments.find(
      (a) => a.status === "awaiting_payment",
    )!;
    expect(() =>
      recordVerifiedPaymentSync(state, {
        appointmentId: awaiting.id,
        amountPaisa: 100000,
        actorUserId: "user-doc-ahmed",
        method: "cash",
      }),
    ).toThrow(DemoOperationError);
  });

  it("denies verify_payment, cancel, and callback updates to reception", () => {
    const now = getDemoNow();
    const state = createSeedState(now);
    const awaiting = state.appointments.find(
      (a) => a.status === "awaiting_payment",
    )!;
    const confirmed = state.appointments.find((a) => a.status === "confirmed")!;
    const callback = state.callbacks[0]!;

    expect(() =>
      recordVerifiedPaymentSync(state, {
        appointmentId: awaiting.id,
        amountPaisa: 100000,
        actorUserId: "user-reception-sara",
        method: "cash",
      }),
    ).toThrow(DemoOperationError);

    expect(() =>
      cancelAppointmentSync(state, {
        appointmentId: confirmed.id,
        actorUserId: "user-reception-sara",
      }),
    ).toThrow(DemoOperationError);

    expect(() =>
      updateCallbackStatusSync(
        state,
        callback.id,
        "completed",
        "user-reception-sara",
      ),
    ).toThrow(DemoOperationError);
  });

  it("reconfirms expired booking when slot is still free after verification", () => {
    const now = getDemoNow();
    const seed = createSeedState(now);
    const startIso = pickFutureSlot(seed, "doc-hassan", "svc-consult-cardio");
    const fee = seed.doctorServices.find(
      (d) =>
        d.doctorId === "doc-hassan" && d.serviceId === "svc-consult-cardio",
    )!.feePaisa;
    const { state: booked, result: apt } = createReservationSync(
      seed,
      {
        patientId: "pat-7",
        doctorId: "doc-hassan",
        serviceId: "svc-consult-cardio",
        scheduledStartIso: startIso,
      },
      now,
    );
    const expiredAt = addMinutesIso(apt.expiresAt!, 5);
    const state = reconcileExpiredReservations(booked, new Date(expiredAt));
    expect(state.appointments.find((a) => a.id === apt.id)!.status).toBe(
      "expired",
    );

    const paid = recordVerifiedPaymentSync(
      state,
      {
        appointmentId: apt.id,
        amountPaisa: Math.ceil(fee / 2),
        actorUserId: "user-admin",
        method: "cash",
      },
      new Date(expiredAt),
    );
    expect(paid.result.status).toBe("confirmed");
    expect(paid.result.requiresPaymentResolution).toBeFalsy();
  });

  it("flags payment resolution when verifying after expiry but slot was taken", () => {
    const now = getDemoNow();
    const seed = createSeedState(now);
    const startIso = pickFutureSlot(seed, "doc-hassan", "svc-consult-cardio");
    const fee = seed.doctorServices.find(
      (d) =>
        d.doctorId === "doc-hassan" && d.serviceId === "svc-consult-cardio",
    )!.feePaisa;

    const first = createReservationSync(
      seed,
      {
        patientId: "pat-7",
        doctorId: "doc-hassan",
        serviceId: "svc-consult-cardio",
        scheduledStartIso: startIso,
        clientRequestId: "expire-a",
      },
      now,
    );
    const apt = first.result;
    const expiredAt = addMinutesIso(apt.expiresAt!, 5);
    const expired = reconcileExpiredReservations(first.state, new Date(expiredAt));

    const state = createReservationSync(
      expired,
      {
        patientId: "pat-8",
        doctorId: "doc-hassan",
        serviceId: "svc-consult-cardio",
        scheduledStartIso: startIso,
        clientRequestId: "expire-b",
      },
      new Date(expiredAt),
    ).state;

    const paid = recordVerifiedPaymentSync(
      state,
      {
        appointmentId: apt.id,
        amountPaisa: Math.ceil(fee / 2),
        actorUserId: "user-admin",
        method: "cash",
      },
      new Date(expiredAt),
    );
    expect(paid.result.status).toBe("expired");
    expect(paid.result.paymentStatus).toBe("review_required");
    expect(paid.result.requiresPaymentResolution).toBe(true);
    expect(paid.result.rescheduleResolutionRequired).toBe(true);
  });

  it("does not change appointment payment when callback is completed", () => {
    const now = getDemoNow();
    const state = createSeedState(now);
    const callback = state.callbacks.find((c) => c.status !== "completed")!;
    const aptBefore = state.appointments.find(
      (a) => a.patientId === callback.patientId,
    );
    const { state: next } = updateCallbackStatusSync(
      state,
      callback.id,
      "completed",
      "user-admin",
    );
    const cb = next.callbacks.find((c) => c.id === callback.id)!;
    expect(cb.status).toBe("completed");
    if (aptBefore) {
      const aptAfter = next.appointments.find((a) => a.id === aptBefore.id)!;
      expect(aptAfter.paymentStatus).toBe(aptBefore.paymentStatus);
      expect(aptAfter.verifiedAmountPaisa).toBe(aptBefore.verifiedAmountPaisa);
    }
  });

  it("keeps original slot when reschedule target is unavailable", () => {
    const now = getDemoNow();
    const state = createSeedState(now);
    const ahmedConfirmed = state.appointments.filter(
      (a) => a.doctorId === "doc-ahmed" && a.status === "confirmed",
    );
    expect(ahmedConfirmed.length).toBeGreaterThanOrEqual(2);
    const toMove = ahmedConfirmed[0];
    const occupiedStart = ahmedConfirmed[1].scheduledStartIso;
    const attempt = rescheduleAppointmentSync(
      state,
      {
        appointmentId: toMove.id,
        newStartIso: occupiedStart,
        actorUserId: "user-admin",
      },
      now,
    );
    expect(attempt.result.scheduledStartIso).toBe(toMove.scheduledStartIso);
    expect(
      attempt.state.appointments.find((a) => a.id === toMove.id)!
        .scheduledStartIso,
    ).toBe(toMove.scheduledStartIso);
  });

  it("getAppointments async respects MOCK delay", async () => {
    const adapter = createInMemoryAdapter(createSeedState());
    const start = Date.now();
    await getAppointments(adapter, { doctorId: "doc-khan" });
    expect(Date.now() - start).toBeGreaterThanOrEqual(MOCK_DELAY_MS - 20);
  });

  it("reconcileExpiredReservations via advanceDemoMinutes on active reservation", () => {
    resetDemoClock();
    const now = getDemoNow();
    const seed = createSeedState(now);
    const startIso = pickFutureSlot(seed, "doc-fatima", "svc-consult-gp");
    const { state: booked, result: apt } = createReservationSync(
      seed,
      {
        patientId: "pat-1",
        doctorId: "doc-fatima",
        serviceId: "svc-consult-gp",
        scheduledStartIso: startIso,
      },
      now,
    );
    advanceDemoMinutes(seed.hospitalSettings.defaultReservationExpiryMinutes + 5);
    const state = reconcileExpiredReservations(booked, getDemoNow());
    const updated = state.appointments.find((a) => a.id === apt.id)!;
    expect(updated.status).toBe("expired");
  });
});
