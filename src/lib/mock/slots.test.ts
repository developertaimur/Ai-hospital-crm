import { afterEach, describe, expect, it } from "vitest";
import {
  createReservationSync,
  DemoOperationError,
  getAvailableSlotsSync,
} from "@/lib/mock/repository";
import { createSeedState } from "@/lib/mock/seed";
import { getDemoNow, resetDemoClock, toKarachiDateKey } from "@/lib/time";

describe("doctor/service slot overlap", () => {
  afterEach(() => {
    resetDemoClock();
  });

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

  it("prevents a second booking on the same doctor slot", () => {
    const now = getDemoNow();
    const state = createSeedState(now);
    const doctorId = "doc-fatima";
    const serviceId = "svc-consult-gp";
    const startIso = pickFutureSlot(state, doctorId, serviceId);

    const first = createReservationSync(state, {
      patientId: "pat-1",
      doctorId,
      serviceId,
      scheduledStartIso: startIso,
      clientRequestId: "req-slot-1",
    });

    expect(() =>
      createReservationSync(first.state, {
        patientId: "pat-2",
        doctorId,
        serviceId,
        scheduledStartIso: startIso,
        clientRequestId: "req-slot-2",
      }),
    ).toThrow(DemoOperationError);
  });

  it("blocks overlapping service durations for the same doctor", () => {
    const now = getDemoNow();
    const state = createSeedState(now);
    const doctorId = "doc-ahmed";
    const consult = "svc-consult-cardio";
    const echo = "svc-echo";
    const startIso = pickFutureSlot(state, doctorId, consult);

    const first = createReservationSync(state, {
      patientId: "pat-1",
      doctorId,
      serviceId: consult,
      scheduledStartIso: startIso,
    });

    expect(() =>
      createReservationSync(first.state, {
        patientId: "pat-2",
        doctorId,
        serviceId: echo,
        scheduledStartIso: startIso,
      }),
    ).toThrow(DemoOperationError);
  });
});
