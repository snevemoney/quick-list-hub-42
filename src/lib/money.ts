/** Integer-cent helpers. DB NUMERIC columns still store dollars; convert at the edge. */

const DOLLAR_INPUT = /^(\d+)(?:\.(\d{1,2}))?$/;

export function parseDollarInputToCents(raw: string): number | null {
  const trimmed = raw.trim();
  const match = DOLLAR_INPUT.exec(trimmed);
  if (!match) return null;
  const dollars = Number.parseInt(match[1], 10);
  const cents = Number.parseInt((match[2] ?? "").padEnd(2, "0") || "0", 10);
  if (!Number.isFinite(dollars) || !Number.isFinite(cents)) return null;
  const total = dollars * 100 + cents;
  if (total < 0 || total > 99_999_999) return null;
  return total;
}

/** Convert a DB dollar NUMERIC/number into integer cents without float rounding. */
export function dollarsToCents(value: number | string | null | undefined): number {
  if (value == null) return 0;
  const asString =
    typeof value === "number" && Number.isFinite(value) ? value.toFixed(2) : String(value);
  return parseDollarInputToCents(asString) ?? 0;
}

export function centsToDollarString(cents: number): string {
  const safe = Math.trunc(cents);
  const sign = safe < 0 ? "-" : "";
  const abs = Math.abs(safe);
  const dollars = Math.floor(abs / 100);
  const remainder = abs % 100;
  return `${sign}${dollars}.${String(remainder).padStart(2, "0")}`;
}

/** Whole-dollar display used across listing cards (matches previous toFixed(0) UI). */
export function formatListingPrice(value: number | string | null | undefined): string {
  const cents = dollarsToCents(value);
  return `$${Math.trunc(cents / 100)}`;
}

export const LISTING_FEE_CENTS = 500;
