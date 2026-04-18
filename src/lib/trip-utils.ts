import type { Timestamp } from "firebase/firestore";
import type { Expense, Trip } from "@/types/models";

/** Human-readable date range for trip headers and cards */
export function formatTripDateRange(trip: Pick<Trip, "startDate" | "endDate">): string {
  const s = trip.startDate || "";
  const e = trip.endDate;
  if (s && e && e !== s) return `${s} – ${e}`;
  return s || "—";
}

/** e.g. "Apr 20 - 25" for list rows */
export function formatTripDateRangeShort(
  trip: Pick<Trip, "startDate" | "endDate">,
): string {
  function part(iso: string): string {
    if (!iso || iso.length < 10) return "";
    const d = new Date(`${iso.slice(0, 10)}T12:00:00`);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }
  const a = part(trip.startDate || "");
  const b = trip.endDate ? part(trip.endDate) : "";
  if (a && b && b !== a) return `${a} - ${b}`;
  return a || "—";
}

/** Relative time from Firestore timestamp (e.g. "2h ago") */
export function formatRelativeFirestore(ts: Timestamp | undefined): string {
  if (!ts?.toMillis) return "";
  const diffMs = Date.now() - ts.toMillis();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 14) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

const TRIP_LIST_EMOJIS = ["🏖️", "🏔️", "🛶", "🏯", "✈️", "🎒", "🌴", "⛵"] as const;

export function tripListEmoji(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) | 0;
  }
  return TRIP_LIST_EMOJIS[Math.abs(h) % TRIP_LIST_EMOJIS.length];
}

export function tripListGradientClass(seed: string): string {
  const gradients = [
    "from-emerald-400 to-teal-500",
    "from-teal-400 to-cyan-500",
    "from-lime-400 to-emerald-600",
    "from-cyan-400 to-emerald-700",
    "from-emerald-500 to-sky-600",
  ] as const;
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 17 + seed.charCodeAt(i)) | 0;
  }
  return gradients[Math.abs(h) % gradients.length];
}

/** Positive = should receive money; negative = owes money */
export function computeBalances(
  memberIds: string[],
  expenses: Pick<Expense, "amount" | "paidBy" | "splitBetween">[],
): Record<string, number> {
  const balances: Record<string, number> = {};
  for (const id of memberIds) balances[id] = 0;
  for (const e of expenses) {
    const n = e.splitBetween.length;
    if (n === 0) continue;
    const share = e.amount / n;
    balances[e.paidBy] = (balances[e.paidBy] ?? 0) + e.amount;
    for (const uid of e.splitBetween) {
      balances[uid] = (balances[uid] ?? 0) - share;
    }
  }
  return balances;
}

export function totalSpent(
  expenses: Pick<Expense, "amount">[],
): number {
  return expenses.reduce((s, e) => s + e.amount, 0);
}

export function generateInviteToken(): string {
  const bytes = new Uint8Array(16);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
