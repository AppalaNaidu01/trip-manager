import type { Timestamp } from "firebase/firestore";
import type { Expense, Trip, TripMember } from "@/types/models";

/** Uppercase pill for hero, e.g. "DEC 12 — DEC 25, 2023" */
export function formatTripDateHeroPill(
  trip: Pick<Trip, "startDate" | "endDate">,
): string {
  const s = trip.startDate?.slice(0, 10);
  const e = trip.endDate?.slice(0, 10) || s;
  if (!s) return "";
  const short = (iso: string) => {
    const d = new Date(`${iso}T12:00:00`);
    if (Number.isNaN(d.getTime())) return "";
    return d
      .toLocaleDateString("en-US", { month: "short", day: "numeric" })
      .toUpperCase();
  };
  const long = (iso: string) => {
    const d = new Date(`${iso}T12:00:00`);
    if (Number.isNaN(d.getTime())) return "";
    return d
      .toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
      .toUpperCase();
  };
  if (e && e !== s) return `${short(s)} — ${long(e)}`;
  return long(s);
}

/** Short initials from display name (max 2 chars) */
export function memberInitials(name: string): string {
  const p = name.trim().split(/\s+/).filter(Boolean);
  if (p.length === 0) return "?";
  if (p.length === 1) return p[0]!.slice(0, 2).toUpperCase();
  return `${p[0]![0] ?? ""}${p[1]![0] ?? ""}`.toUpperCase();
}

/** One-line balance narrative for overview cards */
export function balanceNarrative(
  uid: string,
  members: Pick<TripMember, "userId" | "name">[],
  balances: Record<string, number>,
): string {
  const b = balances[uid] ?? 0;
  const pos = members.filter((m) => (balances[m.userId] ?? 0) > 0.005);
  const neg = members.filter((m) => (balances[m.userId] ?? 0) < -0.005);
  if (b > 0.005) {
    if (neg.length >= 1) return "is owed by everyone";
    return "Group credit";
  }
  if (b < -0.005) {
    const creditor = [...pos].sort(
      (a, x) => (balances[x.userId] ?? 0) - (balances[a.userId] ?? 0),
    )[0];
    if (creditor) return `Owes ${creditor.name}`;
    return "Owes the group";
  }
  return "Settled up";
}

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

export type TripTimelineKind = "current" | "planned" | "past";

/**
 * Classify a trip for dashboard sections using local calendar days.
 * Closed trips are shown as past.
 */
export function tripTimelineKind(
  trip: Pick<Trip, "startDate" | "endDate" | "closed">,
  now = new Date(),
): TripTimelineKind {
  if (trip.closed) return "past";
  const startStr = trip.startDate?.slice(0, 10) || "1970-01-01";
  const endStr = trip.endDate?.slice(0, 10) || startStr;
  const [ys, ms, ds] = startStr.split("-").map(Number);
  const [ye, me, de] = endStr.split("-").map(Number);
  const start = new Date(ys, ms - 1, ds);
  const end = new Date(ye, me - 1, de);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tToday = today.getTime();
  if (end.getTime() < tToday) return "past";
  if (start.getTime() > tToday) return "planned";
  return "current";
}

/** e.g. "May 2024" for compact list rows */
export function formatMonthYear(iso: string): string {
  if (!iso || iso.length < 10) return "—";
  const d = new Date(`${iso.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

/** e.g. "Aug 12, 2024 - Aug 24, 2024" for featured cards */
export function formatTripDateRangeCard(
  trip: Pick<Trip, "startDate" | "endDate">,
): string {
  function part(iso: string): string {
    if (!iso || iso.length < 10) return "";
    const d = new Date(`${iso.slice(0, 10)}T12:00:00`);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }
  const a = part(trip.startDate || "");
  const b = trip.endDate ? part(trip.endDate) : "";
  if (a && b && b !== a) return `${a} - ${b}`;
  return a || "—";
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

const ROUND_MONEY = (n: number) => Math.round(n * 100) / 100;

/**
 * Greedy pairwise settlements that zero net balances (same sum as group nets).
 */
export function suggestedSettlements(
  memberIds: string[],
  balances: Record<string, number>,
): { from: string; to: string; amount: number }[] {
  const EPS = 0.005;
  const bal: Record<string, number> = {};
  for (const id of memberIds) {
    bal[id] = balances[id] ?? 0;
  }
  const out: { from: string; to: string; amount: number }[] = [];
  for (;;) {
    let debtor: string | null = null;
    let creditor: string | null = null;
    let minB = 0;
    let maxB = 0;
    for (const id of memberIds) {
      const b = bal[id] ?? 0;
      if (b < minB - EPS) {
        minB = b;
        debtor = id;
      }
      if (b > maxB + EPS) {
        maxB = b;
        creditor = id;
      }
    }
    if (!debtor || !creditor || minB >= -EPS || maxB <= EPS) break;
    const pay = Math.min(-bal[debtor]!, bal[creditor]!);
    if (pay <= EPS) break;
    const rounded = ROUND_MONEY(pay);
    out.push({ from: debtor, to: creditor, amount: rounded });
    bal[debtor] = ROUND_MONEY((bal[debtor] ?? 0) + rounded);
    bal[creditor] = ROUND_MONEY((bal[creditor] ?? 0) - rounded);
  }
  return out;
}

export function transfersForUser(
  uid: string,
  transfers: { from: string; to: string; amount: number }[],
): { from: string; to: string; amount: number }[] {
  return transfers.filter((t) => t.from === uid || t.to === uid);
}

/** Labels for hero cards: who you pay / who pays you (from suggested transfers). */
export function expenseHeroSummaries(
  uid: string,
  transfers: { from: string; to: string; amount: number }[],
  nameOf: (id: string) => string,
): {
  youOwe: { total: number; counterparties: string[] } | null;
  owedToYou: { total: number; counterparties: string[] } | null;
} {
  let oweTotal = 0;
  const oweTo = new Map<string, number>();
  let owedTotal = 0;
  const owedFrom = new Map<string, number>();
  for (const t of transfers) {
    if (t.from === uid) {
      oweTotal += t.amount;
      oweTo.set(t.to, (oweTo.get(t.to) ?? 0) + t.amount);
    }
    if (t.to === uid) {
      owedTotal += t.amount;
      owedFrom.set(t.from, (owedFrom.get(t.from) ?? 0) + t.amount);
    }
  }
  const fmt = (m: Map<string, number>) =>
    [...m.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([id]) => nameOf(id));
  return {
    youOwe:
      oweTotal > 0.005
        ? { total: ROUND_MONEY(oweTotal), counterparties: fmt(oweTo) }
        : null,
    owedToYou:
      owedTotal > 0.005
        ? { total: ROUND_MONEY(owedTotal), counterparties: fmt(owedFrom) }
        : null,
  };
}

export function formatCounterpartyNames(names: string[]): string {
  if (names.length === 0) return "";
  if (names.length === 1) return names[0]!;
  if (names.length === 2) return `${names[0]!} & ${names[1]!}`;
  return `${names.slice(0, -1).join(", ")} & ${names.at(-1)!}`;
}
