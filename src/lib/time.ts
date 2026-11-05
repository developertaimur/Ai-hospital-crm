import { addMinutes, format, isBefore, parseISO } from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";

export const TZ = "Asia/Karachi";

let demoOffsetMs = 0;

export function getDemoNow(): Date {
  return new Date(Date.now() + demoOffsetMs);
}

export function setDemoOffsetMs(offsetMs: number): void {
  demoOffsetMs = offsetMs;
}

export function advanceDemoMinutes(minutes: number): void {
  demoOffsetMs += minutes * 60 * 1000;
}

export function resetDemoClock(): void {
  demoOffsetMs = 0;
}

export function getDemoOffsetMs(): number {
  return demoOffsetMs;
}

export function formatKarachi(iso: string, pattern: string): string {
  const date = parseISO(iso);
  const zoned = toZonedTime(date, TZ);
  return format(zoned, pattern);
}

/** Calendar date in Karachi as YYYY-MM-DD */
export function toKarachiDateKey(iso: string): string {
  return formatKarachi(iso, "yyyy-MM-dd");
}

export function karachiDayBounds(dateKey: string): { startIso: string; endIso: string } {
  const startLocal = `${dateKey}T00:00:00`;
  const endLocal = `${dateKey}T23:59:59.999`;
  const startUtc = fromZonedTime(startLocal, TZ);
  const endUtc = fromZonedTime(endLocal, TZ);
  return { startIso: startUtc.toISOString(), endIso: endUtc.toISOString() };
}

export function addMinutesIso(iso: string, minutes: number): string {
  return addMinutes(parseISO(iso), minutes).toISOString();
}

export function isPastInKarachi(iso: string, now: Date = getDemoNow()): boolean {
  return isBefore(parseISO(iso), now);
}

/** Parse HH:mm in Karachi context for a given date key */
export function karachiTimeOnDateKey(dateKey: string, timeHHmm: string): string {
  const local = `${dateKey}T${timeHHmm}:00`;
  return fromZonedTime(local, TZ).toISOString();
}

export function karachiDayOfWeek(dateKey: string): number {
  const noon = fromZonedTime(`${dateKey}T12:00:00`, TZ);
  return toZonedTime(noon, TZ).getDay();
}
