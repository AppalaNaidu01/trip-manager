import type { Expense, Trip } from "@/types/models";

/** Human-readable date range for trip headers and cards */
export function formatTripDateRange(trip: Pick<Trip, "startDate" | "endDate">): string {
  const s = trip.startDate || "";
  const e = trip.endDate;
  if (s && e && e !== s) return `${s} – ${e}`;
  return s || "—";
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
