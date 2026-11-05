import { addMinutes, parseISO } from "date-fns";
import type { Appointment, DemoState, DoctorService } from "@/lib/types";
import {
  addMinutesIso,
  isPastInKarachi,
  karachiDayOfWeek,
  karachiTimeOnDateKey,
  toKarachiDateKey,
} from "@/lib/time";

export interface GetAvailableSlotsParams {
  doctorId: string;
  serviceId: string;
  dateKey: string;
  state: DemoState;
  now: Date;
}

const SLOT_STEP_MINUTES = 15;

function getDoctorService(
  state: DemoState,
  doctorId: string,
  serviceId: string,
): DoctorService | undefined {
  return state.doctorServices.find(
    (ds) => ds.doctorId === doctorId && ds.serviceId === serviceId,
  );
}

function isOnLeave(state: DemoState, doctorId: string, dateKey: string): boolean {
  return state.leavePeriods.some(
    (l) =>
      l.doctorId === doctorId &&
      dateKey >= l.startDateKey &&
      dateKey <= l.endDateKey,
  );
}

function getWorkingWindows(
  state: DemoState,
  doctorId: string,
  dateKey: string,
  workingPeriodIds: string[],
): { startIso: string; endIso: string }[] {
  const dow = karachiDayOfWeek(dateKey);
  const hours = state.workingHours.filter(
    (wh) =>
      wh.doctorId === doctorId &&
      wh.dayOfWeek === dow &&
      (workingPeriodIds.length === 0 || workingPeriodIds.includes(wh.id)),
  );
  return hours.map((wh) => ({
    startIso: karachiTimeOnDateKey(dateKey, wh.startTime),
    endIso: karachiTimeOnDateKey(dateKey, wh.endTime),
  }));
}

function getBreakWindows(
  state: DemoState,
  doctorId: string,
  dateKey: string,
): { startIso: string; endIso: string }[] {
  const dow = karachiDayOfWeek(dateKey);
  return state.breakPeriods
    .filter(
      (b) =>
        b.doctorId === doctorId &&
        (b.dayOfWeek === undefined || b.dayOfWeek === dow),
    )
    .map((b) => ({
      startIso: karachiTimeOnDateKey(dateKey, b.startTime),
      endIso: karachiTimeOnDateKey(dateKey, b.endTime),
    }));
}

function getBlockedWindows(
  state: DemoState,
  doctorId: string,
  dateKey: string,
): { startIso: string; endIso: string }[] {
  return state.blockedPeriods
    .filter((b) => b.doctorId === doctorId && b.startIso.slice(0, 10) <= dateKey && b.endIso.slice(0, 10) >= dateKey)
    .map((b) => ({ startIso: b.startIso, endIso: b.endIso }));
}

function appointmentBlocksSlot(
  apt: Appointment,
  now: Date,
): boolean {
  if (apt.status === "confirmed") return true;
  if (apt.status === "awaiting_payment") {
    if (apt.expiresAt && apt.expiresAt > now.toISOString()) return true;
    return false;
  }
  if (apt.status === "completed") return false;
  return false;
}

function getBlockingAppointments(
  state: DemoState,
  doctorId: string,
  dateKey: string,
  now: Date,
): { startIso: string; endIso: string; bufferMinutes: number }[] {
  const result: { startIso: string; endIso: string; bufferMinutes: number }[] =
    [];

  for (const apt of state.appointments) {
    if (apt.doctorId !== doctorId) continue;
    if (!appointmentBlocksSlot(apt, now)) continue;
    const aptKey = toDateKey(apt.scheduledStartIso);
    if (aptKey !== dateKey) continue;
    const ds = state.doctorServices.find(
      (d) => d.doctorId === apt.doctorId && d.serviceId === apt.serviceId,
    );
    result.push({
      startIso: apt.scheduledStartIso,
      endIso: apt.scheduledEndIso,
      bufferMinutes: ds?.bufferMinutes ?? 0,
    });
  }
  return result;
}

function toDateKey(iso: string): string {
  return iso.includes("T") ? toKarachiDateKey(iso) : iso;
}

function overlaps(
  startA: Date,
  endA: Date,
  startB: Date,
  endB: Date,
): boolean {
  return startA < endB && endA > startB;
}

function isBlocked(
  slotStart: Date,
  slotEndWithBuffer: Date,
  blocks: { startIso: string; endIso: string }[],
): boolean {
  for (const b of blocks) {
    const bs = parseISO(b.startIso);
    const be = parseISO(b.endIso);
    if (overlaps(slotStart, slotEndWithBuffer, bs, be)) return true;
  }
  return false;
}

function conflictsWithAppointments(
  slotStart: Date,
  slotEnd: Date,
  bufferMinutes: number,
  appointments: { startIso: string; endIso: string; bufferMinutes: number }[],
): boolean {
  const slotEndBuffered = addMinutes(slotEnd, bufferMinutes);
  for (const apt of appointments) {
    const aStart = parseISO(apt.startIso);
    const aEnd = addMinutes(parseISO(apt.endIso), apt.bufferMinutes);
    if (overlaps(slotStart, slotEndBuffered, aStart, aEnd)) return true;
  }
  return false;
}

export function getAvailableSlots(params: GetAvailableSlotsParams): string[] {
  const { doctorId, serviceId, dateKey, state, now } = params;
  const ds = getDoctorService(state, doctorId, serviceId);
  if (!ds) return [];
  if (isOnLeave(state, doctorId, dateKey)) return [];

  const duration = ds.durationMinutes;
  const buffer = ds.bufferMinutes;
  const windows = getWorkingWindows(state, doctorId, dateKey, ds.workingPeriodIds);
  if (windows.length === 0) return [];

  const breaks = getBreakWindows(state, doctorId, dateKey);
  const blocked = getBlockedWindows(state, doctorId, dateKey);
  const allBlocks = [...breaks, ...blocked];
  const blockingApts = getBlockingAppointments(state, doctorId, dateKey, now);

  const slots: string[] = [];

  for (const window of windows) {
    let cursor = parseISO(window.startIso);
    const windowEnd = parseISO(window.endIso);

    while (cursor < windowEnd) {
      const slotStartIso = cursor.toISOString();
      const slotEnd = addMinutes(cursor, duration);
      const slotEndWithBuffer = addMinutes(slotEnd, buffer);

      if (slotEndWithBuffer > windowEnd) break;

      if (
        !isPastInKarachi(slotStartIso, now) &&
        !isBlocked(cursor, slotEndWithBuffer, allBlocks) &&
        !conflictsWithAppointments(cursor, slotEnd, buffer, blockingApts)
      ) {
        slots.push(slotStartIso);
      }

      cursor = addMinutes(cursor, SLOT_STEP_MINUTES);
    }
  }

  return slots;
}

export function isSlotAvailable(
  state: DemoState,
  doctorId: string,
  serviceId: string,
  startIso: string,
  now: Date,
  excludeAppointmentId?: string,
): boolean {
  const dateKey = toDateKey(startIso);
  const filtered: DemoState = excludeAppointmentId
    ? {
        ...state,
        appointments: state.appointments.filter(
          (a) => a.id !== excludeAppointmentId,
        ),
      }
    : state;
  const slots = getAvailableSlots({
    doctorId,
    serviceId,
    dateKey,
    state: filtered,
    now,
  });
  return slots.includes(startIso);
}

export function computeScheduledEnd(
  state: DemoState,
  doctorId: string,
  serviceId: string,
  startIso: string,
): string {
  const ds = getDoctorService(state, doctorId, serviceId);
  const minutes = ds?.durationMinutes ?? 30;
  return addMinutesIso(startIso, minutes);
}
