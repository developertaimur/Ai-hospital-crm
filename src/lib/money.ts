/** Amounts are stored as integer paisa (PKR × 100). */

export function formatPkr(paisa: number): string {
  const rupees = paisa / 100;
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(rupees);
}

export function parsePkrToPaisa(input: string): number {
  const cleaned = input.replace(/[^\d.,]/g, "").replace(/,/g, "");
  if (!cleaned) return 0;
  const value = parseFloat(cleaned);
  if (Number.isNaN(value)) return 0;
  return Math.round(value * 100);
}

export function add(...amounts: number[]): number {
  return amounts.reduce((sum, n) => sum + n, 0);
}

export function percentOf(totalPaisa: number, percent: number): number {
  return Math.round((totalPaisa * percent) / 100);
}

/** True when verified amount is at least half of total (50% threshold). */
export function meetsHalfThreshold(
  verifiedPaisa: number,
  totalPaisa: number,
): boolean {
  if (totalPaisa <= 0) return verifiedPaisa > 0;
  return verifiedPaisa * 2 >= totalPaisa;
}
