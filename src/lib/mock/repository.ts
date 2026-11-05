import { getPermissionsForUser, hasPermission } from "@/lib/auth/demo-accounts";
import { renderNotificationTemplate } from "@/lib/i18n/notification-templates";
import { meetsHalfThreshold } from "@/lib/money";
import { normalizePkMobile } from "@/lib/phone";
import { reconcileExpiredReservations } from "@/lib/mock/expiry";
import {
  computeScheduledEnd,
  getAvailableSlots as computeSlots,
  isSlotAvailable,
} from "@/lib/mock/slots";
import { createSeedState } from "@/lib/mock/seed";
import type {
  ActivityEvent,
  Appointment,
  AppointmentStatus,
  ArrivalStatus,
  CallbackRequest,
  CallbackStatus,
  DemoState,
  HospitalSettings,
  NotificationKind,
  NotificationRecord,
  Payment,
  PaymentClaim,
} from "@/lib/types";
import {
  addMinutesIso,
  advanceDemoMinutes,
  formatKarachi,
  getDemoNow,
  resetDemoClock,
  setDemoOffsetMs,
  toKarachiDateKey,
} from "@/lib/time";
import { formatPkr } from "@/lib/money";
import { id } from "@/lib/utils";

export const MOCK_DELAY_MS = 150;

export class DemoOperationError extends Error {
  constructor(
    message: string,
    public op: string,
  ) {
    super(message);
    this.name = "DemoOperationError";
  }
}

export interface DemoStoreAdapter {
  getState: () => DemoState;
  setState: (state: DemoState) => void;
  getForceFail: () => Record<string, boolean>;
}

async function artificialDelay(): Promise<void> {
  await new Promise((r) => setTimeout(r, MOCK_DELAY_MS));
}

function assertOp(adapter: DemoStoreAdapter, op: string): void {
  if (adapter.getForceFail()[op]) {
    throw new DemoOperationError(`Forced failure (demo): ${op}`, op);
  }
}

function withReconcile(state: DemoState, now: Date): DemoState {
  return reconcileExpiredReservations(state, now);
}

function pushActivity(
  state: DemoState,
  event: Omit<ActivityEvent, "id" | "createdAt">,
  nowIso: string,
): DemoState {
  return {
    ...state,
    activityEvents: [
      { ...event, id: id("act"), createdAt: nowIso },
      ...state.activityEvents,
    ],
  };
}

function findUser(state: DemoState, userId: string) {
  return state.users.find((u) => u.id === userId);
}

function requirePermission(
  state: DemoState,
  actorUserId: string,
  permission: Parameters<typeof hasPermission>[1],
): void {
  const user = findUser(state, actorUserId);
  const perms =
    user?.permissions ?? getPermissionsForUser(actorUserId);
  if (!hasPermission(perms, permission)) {
    throw new DemoOperationError("Permission denied", "auth");
  }
}

function lookupNames(state: DemoState, apt: Appointment) {
  const patient = state.patients.find((p) => p.id === apt.patientId);
  const doctor = state.doctors.find((d) => d.id === apt.doctorId);
  const service = state.services.find((s) => s.id === apt.serviceId);
  return {
    patientName: patient?.fullName ?? "Patient",
    doctorName: doctor?.displayName ?? "Doctor",
    serviceName: service?.name ?? "Service",
  };
}

function notificationChannelForPatient(
  state: DemoState,
  patientId: string,
): NotificationRecord["channel"] {
  const patient = state.patients.find((p) => p.id === patientId);
  if (patient?.email?.trim()) return "email";
  return "sms";
}

function queueNotification(
  state: DemoState,
  params: {
    kind: NotificationKind;
    appointmentId: string;
    patientId: string;
    locale: "en" | "ur";
    templateKey: Parameters<typeof renderNotificationTemplate>[1];
    apt: Appointment;
    nowIso: string;
  },
): DemoState {
  const names = lookupNames(state, params.apt);
  const dateTimeFormatted = formatKarachi(
    params.apt.scheduledStartIso,
    "dd MMM yyyy, hh:mm a",
  );
  const body = renderNotificationTemplate(params.locale, params.templateKey, {
    ...names,
    dateTimeFormatted,
    hospitalName: state.hospitalSettings.hospitalName,
    amountFormatted: formatPkr(params.apt.totalFeePaisa),
  });
  const record: NotificationRecord = {
    id: id("notif"),
    kind: params.kind,
    appointmentId: params.appointmentId,
    patientId: params.patientId,
    channel: notificationChannelForPatient(state, params.patientId),
    locale: params.locale,
    body,
    status: "queued_demo",
    createdAt: params.nowIso,
  };
  return {
    ...state,
    notifications: [record, ...state.notifications],
  };
}

// ——— Read helpers (pure) ———

export function listDoctorsSync(state: DemoState) {
  return state.doctors;
}

export function getDoctorSync(state: DemoState, doctorId: string) {
  return state.doctors.find((d) => d.id === doctorId) ?? null;
}

export function getDoctorServicesSync(state: DemoState, doctorId: string) {
  return state.doctorServices.filter((ds) => ds.doctorId === doctorId);
}

export function getAvailableSlotsSync(
  state: DemoState,
  params: {
    doctorId: string;
    serviceId: string;
    dateKey: string;
    now?: Date;
  },
): string[] {
  const now = params.now ?? getDemoNow();
  const reconciled = withReconcile(state, now);
  return computeSlots({
    doctorId: params.doctorId,
    serviceId: params.serviceId,
    dateKey: params.dateKey,
    state: reconciled,
    now,
  });
}

export function getAppointmentsSync(
  state: DemoState,
  filters?: {
    doctorId?: string;
    dateKey?: string;
    status?: AppointmentStatus;
  },
) {
  return state.appointments.filter((a) => {
    if (filters?.doctorId && a.doctorId !== filters.doctorId) return false;
    if (filters?.status && a.status !== filters.status) return false;
    if (filters?.dateKey) {
      if (toKarachiDateKey(a.scheduledStartIso) !== filters.dateKey) return false;
    }
    return true;
  });
}

export function getAppointmentSync(state: DemoState, appointmentId: string) {
  return state.appointments.find((a) => a.id === appointmentId) ?? null;
}

// ——— Mutations (pure) ———

export interface CreateReservationInput {
  patientId: string;
  doctorId: string;
  serviceId: string;
  scheduledStartIso: string;
  actorUserId?: string;
  clientRequestId?: string;
  locale?: "en" | "ur";
}

export function createReservationSync(
  state: DemoState,
  input: CreateReservationInput,
  now: Date = getDemoNow(),
): { state: DemoState; result: Appointment } {
  let next = withReconcile(state, now);
  const nowIso = now.toISOString();

  if (input.clientRequestId) {
    if (next.processedClientRequestIds.includes(input.clientRequestId)) {
      const existing = next.appointments.find(
        (a) =>
          a.patientId === input.patientId &&
          a.scheduledStartIso === input.scheduledStartIso &&
          a.doctorId === input.doctorId,
      );
      if (existing) {
        return { state: next, result: existing };
      }
      throw new DemoOperationError(
        "Duplicate client request id",
        "createReservation",
      );
    }
  }

  if (
    !isSlotAvailable(
      next,
      input.doctorId,
      input.serviceId,
      input.scheduledStartIso,
      now,
    )
  ) {
    throw new DemoOperationError("Slot no longer available", "createReservation");
  }

  const ds = next.doctorServices.find(
    (d) => d.doctorId === input.doctorId && d.serviceId === input.serviceId,
  );
  if (!ds) {
    throw new DemoOperationError("Service not offered by doctor", "createReservation");
  }

  const expiresAt = addMinutesIso(
    nowIso,
    next.hospitalSettings.defaultReservationExpiryMinutes,
  );

  const apt: Appointment = {
    id: id("apt"),
    patientId: input.patientId,
    doctorId: input.doctorId,
    serviceId: input.serviceId,
    scheduledStartIso: input.scheduledStartIso,
    scheduledEndIso: computeScheduledEnd(
      next,
      input.doctorId,
      input.serviceId,
      input.scheduledStartIso,
    ),
    status: "awaiting_payment",
    arrivalStatus: "scheduled",
    paymentStatus: "unpaid",
    totalFeePaisa: ds.feePaisa,
    verifiedAmountPaisa: 0,
    expiresAt,
    createdAt: nowIso,
    updatedAt: nowIso,
    createdByUserId: input.actorUserId,
  };

  next = {
    ...next,
    appointments: [apt, ...next.appointments],
    processedClientRequestIds: input.clientRequestId
      ? [...next.processedClientRequestIds, input.clientRequestId]
      : next.processedClientRequestIds,
  };

  next = queueNotification(next, {
    kind: "appointment_provisional",
    appointmentId: apt.id,
    patientId: apt.patientId,
    locale: input.locale ?? "en",
    templateKey: "provisional",
    apt,
    nowIso,
  });

  next = pushActivity(
    next,
    {
      type: "appointment_created",
      actorUserId: input.actorUserId,
      message:
        "Reservation created — awaiting payment verification (50% minimum to confirm)",
      entityType: "appointment",
      entityId: apt.id,
    },
    nowIso,
  );

  return { state: next, result: apt };
}

export interface RecordVerifiedPaymentInput {
  appointmentId: string;
  amountPaisa: number;
  actorUserId: string;
  method: Payment["method"];
  reference?: string;
}

export function recordVerifiedPaymentSync(
  state: DemoState,
  input: RecordVerifiedPaymentInput,
  now: Date = getDemoNow(),
): { state: DemoState; result: Appointment } {
  requirePermission(state, input.actorUserId, "verify_payment");
  let next = withReconcile(state, now);
  const nowIso = now.toISOString();
  const idx = next.appointments.findIndex((a) => a.id === input.appointmentId);
  if (idx === -1) {
    throw new DemoOperationError("Appointment not found", "recordVerifiedPayment");
  }

  const apt = next.appointments[idx];
  const payment: Payment = {
    id: id("pay"),
    appointmentId: apt.id,
    patientId: apt.patientId,
    amountPaisa: input.amountPaisa,
    verified: true,
    verifiedAt: nowIso,
    verifiedByUserId: input.actorUserId,
    method: input.method,
    reference: input.reference,
    createdAt: nowIso,
  };

  const verifiedTotal = apt.verifiedAmountPaisa + input.amountPaisa;
  let updated: Appointment = {
    ...apt,
    verifiedAmountPaisa: verifiedTotal,
    updatedAt: nowIso,
  };

  if (meetsHalfThreshold(verifiedTotal, apt.totalFeePaisa)) {
    if (apt.status === "expired") {
      const slotFree = isSlotAvailable(
        next,
        apt.doctorId,
        apt.serviceId,
        apt.scheduledStartIso,
        now,
        apt.id,
      );
      if (!slotFree) {
        updated = {
          ...updated,
          paymentStatus: "review_required",
          requiresPaymentResolution: true,
          rescheduleResolutionRequired: true,
        };
      } else {
        updated = {
          ...updated,
          status: "confirmed",
          paymentStatus:
            verifiedTotal >= apt.totalFeePaisa ? "cleared" : "partial",
          expiresAt: undefined,
        };
        next = queueNotification(next, {
          kind: "appointment_confirmed",
          appointmentId: apt.id,
          patientId: apt.patientId,
          locale: "en",
          templateKey: "confirmation",
          apt: updated,
          nowIso,
        });
      }
    } else if (
      apt.status === "awaiting_payment" ||
      apt.status === "confirmed"
    ) {
      updated = {
        ...updated,
        status: "confirmed",
        paymentStatus:
          verifiedTotal >= apt.totalFeePaisa ? "cleared" : "partial",
        expiresAt: undefined,
      };
      if (apt.status === "awaiting_payment") {
        next = queueNotification(next, {
          kind: "appointment_confirmed",
          appointmentId: apt.id,
          patientId: apt.patientId,
          locale: "en",
          templateKey: "confirmation",
          apt: updated,
          nowIso,
        });
      }
    }
  } else {
    updated = {
      ...updated,
      paymentStatus: "partial",
    };
  }

  const appointments = [...next.appointments];
  appointments[idx] = updated;
  next = {
    ...next,
    appointments,
    payments: [payment, ...next.payments],
  };

  next = pushActivity(
    next,
    {
      type: "payment_verified",
      actorUserId: input.actorUserId,
      message: `Recorded verified payment ${formatPkr(input.amountPaisa)} for appointment ${apt.id}`,
      entityType: "appointment",
      entityId: apt.id,
    },
    nowIso,
  );

  return { state: next, result: updated };
}

export function createPaymentClaimSync(
  state: DemoState,
  input: {
    appointmentId: string;
    claimedAmountPaisa: number;
    submittedByUserId?: string;
    notes?: string;
  },
  now: Date = getDemoNow(),
): { state: DemoState; result: PaymentClaim } {
  const nowIso = now.toISOString();
  const apt = state.appointments.find((a) => a.id === input.appointmentId);
  if (!apt) {
    throw new DemoOperationError("Appointment not found", "createPaymentClaim");
  }
  const claim: PaymentClaim = {
    id: id("claim"),
    appointmentId: apt.id,
    patientId: apt.patientId,
    claimedAmountPaisa: input.claimedAmountPaisa,
    status: "pending_review",
    submittedByUserId: input.submittedByUserId,
    notes: input.notes,
    createdAt: nowIso,
  };
  let next: DemoState = {
    ...state,
    paymentClaims: [claim, ...state.paymentClaims],
  };
  next = pushActivity(
    next,
    {
      type: "payment_claim_created",
      actorUserId: input.submittedByUserId,
      message: `Payment claim submitted — does not auto-verify (${formatPkr(input.claimedAmountPaisa)})`,
      entityType: "appointment",
      entityId: apt.id,
    },
    nowIso,
  );
  return { state: next, result: claim };
}

export function rescheduleAppointmentSync(
  state: DemoState,
  input: {
    appointmentId: string;
    newStartIso: string;
    actorUserId?: string;
  },
  now: Date = getDemoNow(),
): { state: DemoState; result: Appointment } {
  let next = withReconcile(state, now);
  const nowIso = now.toISOString();
  const idx = next.appointments.findIndex((a) => a.id === input.appointmentId);
  if (idx === -1) {
    throw new DemoOperationError("Appointment not found", "rescheduleAppointment");
  }
  const original = next.appointments[idx];
  if (original.status === "cancelled" || original.status === "completed") {
    throw new DemoOperationError(
      "Cannot reschedule this appointment",
      "rescheduleAppointment",
    );
  }

  if (
    !isSlotAvailable(
      next,
      original.doctorId,
      original.serviceId,
      input.newStartIso,
      now,
      original.id,
    )
  ) {
    return { state, result: original };
  }

  const ds = next.doctorServices.find(
    (d) =>
      d.doctorId === original.doctorId && d.serviceId === original.serviceId,
  );
  const newEnd = computeScheduledEnd(
    next,
    original.doctorId,
    original.serviceId,
    input.newStartIso,
  );
  const feeDiff =
    ds && ds.feePaisa !== original.totalFeePaisa
      ? true
      : original.feeDifferenceFlag;

  const updated: Appointment = {
    ...original,
    scheduledStartIso: input.newStartIso,
    scheduledEndIso: newEnd,
    feeDifferenceFlag: feeDiff,
    updatedAt: nowIso,
    expiresAt: original.status === "awaiting_payment" ? original.expiresAt : undefined,
  };

  const appointments = [...next.appointments];
  appointments[idx] = updated;
  next = { ...next, appointments };

  next = queueNotification(next, {
    kind: "appointment_rescheduled",
    appointmentId: updated.id,
    patientId: updated.patientId,
    locale: "en",
    templateKey: "reschedule",
    apt: updated,
    nowIso,
  });

  next = pushActivity(
    next,
    {
      type: "appointment_rescheduled",
      actorUserId: input.actorUserId,
      message: `Rescheduled appointment ${updated.id}`,
      entityType: "appointment",
      entityId: updated.id,
    },
    nowIso,
  );

  return { state: next, result: updated };
}

export function cancelAppointmentSync(
  state: DemoState,
  input: { appointmentId: string; actorUserId?: string },
  now: Date = getDemoNow(),
): { state: DemoState; result: Appointment } {
  const nowIso = now.toISOString();
  const idx = state.appointments.findIndex((a) => a.id === input.appointmentId);
  if (idx === -1) {
    throw new DemoOperationError("Appointment not found", "cancelAppointment");
  }
  const apt = state.appointments[idx];
  const paid = apt.verifiedAmountPaisa > 0;
  const updated: Appointment = {
    ...apt,
    status: "cancelled",
    cancelledAt: nowIso,
    updatedAt: nowIso,
    expiresAt: undefined,
    requiresRefundReview: paid ? true : apt.requiresRefundReview,
    paymentStatus: paid ? "review_required" : apt.paymentStatus,
  };
  const appointments = [...state.appointments];
  appointments[idx] = updated;
  let next: DemoState = { ...state, appointments };

  next = queueNotification(next, {
    kind: "appointment_cancelled",
    appointmentId: updated.id,
    patientId: updated.patientId,
    locale: "en",
    templateKey: "cancel",
    apt: updated,
    nowIso,
  });

  next = pushActivity(
    next,
    {
      type: "appointment_cancelled",
      actorUserId: input.actorUserId,
      message: paid
        ? "Appointment cancelled — refund review required (no auto refund)"
        : "Appointment cancelled",
      entityType: "appointment",
      entityId: updated.id,
    },
    nowIso,
  );

  return { state: next, result: updated };
}

export function updateArrivalStatusSync(
  state: DemoState,
  input: {
    appointmentId: string;
    arrivalStatus: ArrivalStatus;
    actorUserId: string;
  },
): { state: DemoState; result: Appointment } {
  requirePermission(state, input.actorUserId, "update_arrival");
  const idx = state.appointments.findIndex((a) => a.id === input.appointmentId);
  if (idx === -1) {
    throw new DemoOperationError("Appointment not found", "updateArrivalStatus");
  }
  const apt = state.appointments[idx];
  const updated: Appointment = {
    ...apt,
    arrivalStatus: input.arrivalStatus,
    updatedAt: new Date().toISOString(),
    completedAt:
      input.arrivalStatus === "completed"
        ? new Date().toISOString()
        : apt.completedAt,
    status:
      input.arrivalStatus === "completed" ? "completed" : apt.status,
  };
  const appointments = [...state.appointments];
  appointments[idx] = updated;
  return { state: { ...state, appointments }, result: updated };
}

export function updateCallbackStatusSync(
  state: DemoState,
  callbackId: string,
  status: CallbackStatus,
  actorUserId?: string,
): { state: DemoState; result: CallbackRequest } {
  const nowIso = new Date().toISOString();
  const idx = state.callbacks.findIndex((c) => c.id === callbackId);
  if (idx === -1) {
    throw new DemoOperationError("Callback not found", "updateCallbackStatus");
  }
  const updated: CallbackRequest = {
    ...state.callbacks[idx],
    status,
    updatedAt: nowIso,
  };
  const callbacks = [...state.callbacks];
  callbacks[idx] = updated;
  let next: DemoState = { ...state, callbacks };
  next = pushActivity(
    next,
    {
      type: "callback_updated",
      actorUserId,
      message: `Callback ${callbackId} → ${status}`,
      entityType: "callback",
      entityId: callbackId,
    },
    nowIso,
  );
  return { state: next, result: updated };
}

export function assignCallbackSync(
  state: DemoState,
  callbackId: string,
  assignedToUserId: string,
): { state: DemoState; result: CallbackRequest } {
  const idx = state.callbacks.findIndex((c) => c.id === callbackId);
  if (idx === -1) {
    throw new DemoOperationError("Callback not found", "assignCallback");
  }
  const updated: CallbackRequest = {
    ...state.callbacks[idx],
    assignedToUserId,
    status: "assigned",
    updatedAt: new Date().toISOString(),
  };
  const callbacks = [...state.callbacks];
  callbacks[idx] = updated;
  return { state: { ...state, callbacks }, result: updated };
}

export function addCallbackNoteSync(
  state: DemoState,
  callbackId: string,
  authorUserId: string,
  body: string,
): { state: DemoState; result: CallbackRequest } {
  const idx = state.callbacks.findIndex((c) => c.id === callbackId);
  if (idx === -1) {
    throw new DemoOperationError("Callback not found", "addCallbackNote");
  }
  const note = {
    id: id("cbn"),
    authorUserId,
    body,
    createdAt: new Date().toISOString(),
  };
  const updated: CallbackRequest = {
    ...state.callbacks[idx],
    notes: [...state.callbacks[idx].notes, note],
    updatedAt: note.createdAt,
  };
  const callbacks = [...state.callbacks];
  callbacks[idx] = updated;
  return { state: { ...state, callbacks }, result: updated };
}

export function retryNotificationSync(
  state: DemoState,
  notificationId: string,
): { state: DemoState; result: NotificationRecord } {
  const idx = state.notifications.findIndex((n) => n.id === notificationId);
  if (idx === -1) {
    throw new DemoOperationError("Notification not found", "retryNotification");
  }
  const updated: NotificationRecord = {
    ...state.notifications[idx],
    status: "sent_simulated",
    sentAt: new Date().toISOString(),
    errorMessage: undefined,
  };
  const notifications = [...state.notifications];
  notifications[idx] = updated;
  return { state: { ...state, notifications }, result: updated };
}

export function previewNotificationSync(
  state: DemoState,
  params: {
    templateKey: Parameters<typeof renderNotificationTemplate>[1];
    appointmentId: string;
    locale: "en" | "ur";
  },
): string {
  const apt = state.appointments.find((a) => a.id === params.appointmentId);
  if (!apt) return "";
  const names = lookupNames(state, apt);
  return renderNotificationTemplate(params.locale, params.templateKey, {
    ...names,
    dateTimeFormatted: formatKarachi(
      apt.scheduledStartIso,
      "dd MMM yyyy, hh:mm a",
    ),
    hospitalName: state.hospitalSettings.hospitalName,
    amountFormatted: formatPkr(apt.totalFeePaisa),
  });
}

export function updateSettingsSync(
  state: DemoState,
  patch: Partial<HospitalSettings>,
  actorUserId?: string,
): { state: DemoState; result: HospitalSettings } {
  const nowIso = new Date().toISOString();
  const hospitalSettings = { ...state.hospitalSettings, ...patch };
  let next: DemoState = { ...state, hospitalSettings };
  next = pushActivity(
    next,
    {
      type: "settings_updated",
      actorUserId,
      message: "Hospital settings updated (simulated persistence)",
    },
    nowIso,
  );
  return { state: next, result: hospitalSettings };
}

export function simulateStaffAccountChangeSync(
  state: DemoState,
  userId: string,
  patch: { displayName?: string; active?: boolean },
): { state: DemoState; result: DemoState["users"][0] } {
  const idx = state.users.findIndex((u) => u.id === userId);
  if (idx === -1) {
    throw new DemoOperationError("User not found", "simulateStaffAccountChange");
  }
  const updated = { ...state.users[idx], ...patch };
  const users = [...state.users];
  users[idx] = updated;
  const nowIso = new Date().toISOString();
  let next: DemoState = { ...state, users };
  next = pushActivity(
    next,
    {
      type: "staff_change_simulated",
      message: `[Simulated] Staff account updated for ${updated.username}`,
      entityType: "user",
      entityId: userId,
    },
    nowIso,
  );
  return { state: next, result: updated };
}

export function resetDemoDataSync(now: Date = getDemoNow()): DemoState {
  resetDemoClock();
  return createSeedState(now);
}

export function advanceDemoTimeSync(minutes: number): Date {
  advanceDemoMinutes(minutes);
  return getDemoNow();
}

export function setDemoTimeOffsetSync(offsetMs: number): Date {
  setDemoOffsetMs(offsetMs);
  return getDemoNow();
}

// ——— Async API via adapter ———

async function runMutation<T>(
  adapter: DemoStoreAdapter,
  op: string,
  fn: (state: DemoState) => { state: DemoState; result: T },
): Promise<T> {
  assertOp(adapter, op);
  await artificialDelay();
  const current = adapter.getState();
  const { state, result } = fn(current);
  adapter.setState(state);
  return result;
}

async function runRead<T>(
  adapter: DemoStoreAdapter,
  op: string,
  fn: (state: DemoState) => T,
): Promise<T> {
  assertOp(adapter, op);
  await artificialDelay();
  return fn(withReconcile(adapter.getState(), getDemoNow()));
}

export async function listDoctors(adapter: DemoStoreAdapter) {
  return runRead(adapter, "listDoctors", listDoctorsSync);
}

export async function getDoctor(adapter: DemoStoreAdapter, doctorId: string) {
  return runRead(adapter, "getDoctor", (s) => getDoctorSync(s, doctorId));
}

export async function getDoctorServices(
  adapter: DemoStoreAdapter,
  doctorId: string,
) {
  return runRead(adapter, "getDoctorServices", (s) =>
    getDoctorServicesSync(s, doctorId),
  );
}

export async function getAvailableSlots(
  adapter: DemoStoreAdapter,
  params: { doctorId: string; serviceId: string; dateKey: string },
) {
  return runRead(adapter, "getAvailableSlots", (s) =>
    getAvailableSlotsSync(s, { ...params, now: getDemoNow() }),
  );
}

export async function createReservation(
  adapter: DemoStoreAdapter,
  input: CreateReservationInput,
) {
  return runMutation(adapter, "createReservation", (s) =>
    createReservationSync(s, input, getDemoNow()),
  );
}

export async function getAppointments(
  adapter: DemoStoreAdapter,
  filters?: Parameters<typeof getAppointmentsSync>[1],
) {
  return runRead(adapter, "getAppointments", (s) =>
    getAppointmentsSync(s, filters),
  );
}

export async function getAppointment(
  adapter: DemoStoreAdapter,
  appointmentId: string,
) {
  return runRead(adapter, "getAppointment", (s) =>
    getAppointmentSync(s, appointmentId),
  );
}

export async function recordVerifiedPayment(
  adapter: DemoStoreAdapter,
  input: RecordVerifiedPaymentInput,
) {
  return runMutation(adapter, "recordVerifiedPayment", (s) =>
    recordVerifiedPaymentSync(s, input, getDemoNow()),
  );
}

export async function createPaymentClaim(
  adapter: DemoStoreAdapter,
  input: Parameters<typeof createPaymentClaimSync>[1],
) {
  return runMutation(adapter, "createPaymentClaim", (s) =>
    createPaymentClaimSync(s, input, getDemoNow()),
  );
}

export async function rescheduleAppointment(
  adapter: DemoStoreAdapter,
  input: Parameters<typeof rescheduleAppointmentSync>[1],
) {
  return runMutation(adapter, "rescheduleAppointment", (s) =>
    rescheduleAppointmentSync(s, input, getDemoNow()),
  );
}

export async function cancelAppointment(
  adapter: DemoStoreAdapter,
  input: Parameters<typeof cancelAppointmentSync>[1],
) {
  return runMutation(adapter, "cancelAppointment", (s) =>
    cancelAppointmentSync(s, input, getDemoNow()),
  );
}

export async function updateArrivalStatus(
  adapter: DemoStoreAdapter,
  input: Parameters<typeof updateArrivalStatusSync>[1],
) {
  return runMutation(adapter, "updateArrivalStatus", (s) =>
    updateArrivalStatusSync(s, input),
  );
}

export async function getCallbacks(adapter: DemoStoreAdapter) {
  return runRead(adapter, "getCallbacks", (s) => s.callbacks);
}

export async function getCallbackDetails(
  adapter: DemoStoreAdapter,
  callbackId: string,
) {
  return runRead(adapter, "getCallbackDetails", (s) =>
    s.callbacks.find((c) => c.id === callbackId) ?? null,
  );
}

export async function updateCallbackStatus(
  adapter: DemoStoreAdapter,
  callbackId: string,
  status: CallbackStatus,
  actorUserId?: string,
) {
  return runMutation(adapter, "updateCallbackStatus", (s) =>
    updateCallbackStatusSync(s, callbackId, status, actorUserId),
  );
}

export async function assignCallback(
  adapter: DemoStoreAdapter,
  callbackId: string,
  assignedToUserId: string,
) {
  return runMutation(adapter, "assignCallback", (s) =>
    assignCallbackSync(s, callbackId, assignedToUserId),
  );
}

export async function addCallbackNote(
  adapter: DemoStoreAdapter,
  callbackId: string,
  authorUserId: string,
  body: string,
) {
  return runMutation(adapter, "addCallbackNote", (s) =>
    addCallbackNoteSync(s, callbackId, authorUserId, body),
  );
}

export async function getCalls(adapter: DemoStoreAdapter) {
  return runRead(adapter, "getCalls", (s) => s.callRecords);
}

export async function getNotifications(adapter: DemoStoreAdapter) {
  return runRead(adapter, "getNotifications", (s) => s.notifications);
}

export async function retryNotification(
  adapter: DemoStoreAdapter,
  notificationId: string,
) {
  return runMutation(adapter, "retryNotification", (s) =>
    retryNotificationSync(s, notificationId),
  );
}

export async function previewNotification(
  adapter: DemoStoreAdapter,
  params: Parameters<typeof previewNotificationSync>[1],
) {
  return runRead(adapter, "previewNotification", (s) =>
    previewNotificationSync(s, params),
  );
}

export async function listPatients(adapter: DemoStoreAdapter) {
  return runRead(adapter, "listPatients", (s) => s.patients);
}

export async function listPayments(adapter: DemoStoreAdapter) {
  return runRead(adapter, "listPayments", (s) => s.payments);
}

export async function listActivity(adapter: DemoStoreAdapter) {
  return runRead(adapter, "listActivity", (s) => s.activityEvents);
}

export async function getSettings(adapter: DemoStoreAdapter) {
  return runRead(adapter, "getSettings", (s) => s.hospitalSettings);
}

export async function updateSettings(
  adapter: DemoStoreAdapter,
  patch: Partial<HospitalSettings>,
  actorUserId?: string,
) {
  return runMutation(adapter, "updateSettings", (s) =>
    updateSettingsSync(s, patch, actorUserId),
  );
}

export async function simulateStaffAccountChange(
  adapter: DemoStoreAdapter,
  userId: string,
  patch: { displayName?: string; active?: boolean },
) {
  return runMutation(adapter, "simulateStaffAccountChange", (s) =>
    simulateStaffAccountChangeSync(s, userId, patch),
  );
}

export async function resetDemoData(adapter: DemoStoreAdapter) {
  assertOp(adapter, "resetDemoData");
  await artificialDelay();
  const fresh = resetDemoDataSync(getDemoNow());
  adapter.setState(fresh);
  return fresh;
}

export async function advanceDemoTime(
  adapter: DemoStoreAdapter,
  minutes: number,
) {
  assertOp(adapter, "advanceDemoTime");
  await artificialDelay();
  const now = advanceDemoTimeSync(minutes);
  const reconciled = reconcileExpiredReservations(adapter.getState(), now);
  adapter.setState(reconciled);
  return now;
}

export function setForceFail(
  current: Record<string, boolean>,
  opName: string,
  value: boolean,
): Record<string, boolean> {
  return { ...current, [opName]: value };
}

export function createPatientSync(
  state: DemoState,
  input: { fullName: string; phone: string; email?: string },
): { state: DemoState; result: DemoState["patients"][0] } {
  const normalized = normalizePkMobile(input.phone);
  if (!normalized.ok || !normalized.e164 || !normalized.national) {
    throw new DemoOperationError(
      normalized.error ?? "Invalid phone",
      "createPatient",
    );
  }
  const nowIso = new Date().toISOString();
  const patient = {
    id: id("pat"),
    fullName: input.fullName,
    phoneE164: normalized.e164,
    phoneNational: normalized.national,
    email: input.email,
    createdAt: nowIso,
  };
  return {
    state: { ...state, patients: [patient, ...state.patients] },
    result: patient,
  };
}

export async function createPatient(
  adapter: DemoStoreAdapter,
  input: { fullName: string; phone: string; email?: string },
) {
  return runMutation(adapter, "createPatient", (s) => createPatientSync(s, input));
}
