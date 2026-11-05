export interface NormalizePkMobileResult {
  ok: boolean;
  e164?: string;
  national?: string;
  error?: string;
}

const MOBILE_NATIONAL = /^03\d{9}$/;
const MOBILE_E164 = /^\+923\d{9}$/;

function digitsOnly(input: string): string {
  return input.replace(/[\s\-()]/g, "");
}

/**
 * Normalize Pakistani mobile numbers.
 * Accepts 03xxxxxxxxx, +923xxxxxxxxx, 923xxxxxxxxx (with optional spaces/dashes).
 */
export function normalizePkMobile(input: string): NormalizePkMobileResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return { ok: false, error: "Phone number is required" };
  }

  let raw = digitsOnly(trimmed);

  if (raw.startsWith("92") && !raw.startsWith("+")) {
    raw = raw.replace(/^92/, "");
    if (raw.startsWith("3")) {
      raw = `0${raw}`;
    }
  }

  if (raw.startsWith("+")) {
    raw = raw.slice(1);
  }

  if (MOBILE_NATIONAL.test(raw)) {
    const e164 = `+92${raw.slice(1)}`;
    return { ok: true, e164, national: raw };
  }

  if (raw.startsWith("923") && raw.length === 12) {
    const national = `0${raw.slice(2)}`;
    return { ok: true, e164: `+${raw}`, national };
  }

  if (MOBILE_E164.test(`+${raw}`)) {
    const national = `0${raw.slice(2)}`;
    return { ok: true, e164: `+${raw}`, national };
  }

  return {
    ok: false,
    error: "Enter a valid Pakistani mobile (03xx-xxxxxxx or +92 3xx xxxxxxx)",
  };
}
