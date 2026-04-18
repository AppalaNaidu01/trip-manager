"use client";

import {
  expenseHeroSummaries,
  formatCounterpartyNames,
  memberInitials,
  suggestedSettlements,
  totalSpent,
  transfersForUser,
} from "@/lib/trip-utils";
import type { Expense, Trip, TripMember } from "@/types/models";
import type { User } from "firebase/auth";
import { useMemo, useState } from "react";

const EXPENSE_CATEGORIES = [
  "Dining",
  "Transport",
  "Stay",
  "Activities",
  "Groceries",
  "Other",
] as const;

function money(n: number) {
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function CategoryIcon({ category }: { category?: string }) {
  const c = (category ?? "").toLowerCase();
  if (c.includes("transport") || c.includes("car") || c.includes("fuel")) {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
        <path d="M5 17h14v-5l-2-5H7L5 12v5Z" />
        <circle cx="7.5" cy="17.5" r="1.5" />
        <circle cx="16.5" cy="17.5" r="1.5" />
      </svg>
    );
  }
  if (c.includes("stay") || c.includes("hotel")) {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
        <path d="M3 10.5V20h18v-9.5L12 4 3 10.5Z" />
        <path d="M9 20v-6h6v6" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M11 4h-1v8M8 4H7v8M11 12v10M8 12v10" />
      <path d="M17 4c0 3-2 4-2 6v12M19 4c0 3 2 4 2 6v12" />
    </svg>
  );
}

export function TripExpensesPanel({
  trip,
  user,
  members,
  expenses,
  balances,
  amount,
  setAmount,
  paidBy,
  setPaidBy,
  splitIds,
  setSplitIds,
  category,
  setCategory,
  expenseSaving,
  expenseErr,
  onSubmit,
  onRemoveExpense,
}: {
  trip: Trip;
  user: User | null;
  members: TripMember[];
  expenses: Expense[];
  balances: Record<string, number>;
  amount: string;
  setAmount: (v: string) => void;
  paidBy: string;
  setPaidBy: (v: string) => void;
  splitIds: string[];
  setSplitIds: (v: string[] | ((prev: string[]) => string[])) => void;
  category: string;
  setCategory: (v: string) => void;
  expenseSaving: boolean;
  expenseErr: string | null;
  onSubmit: (e: React.FormEvent) => void;
  onRemoveExpense: (ex: Expense) => void;
}) {
  const [showAllRecent, setShowAllRecent] = useState(false);
  const closed = trip.closed === true;

  const memberName = (uid: string) =>
    members.find((m) => m.userId === uid)?.name ?? uid.slice(0, 8);

  const displayPaidBy =
    paidBy || user?.uid || members[0]?.userId || "";

  const allIds = members.map((m) => m.userId);
  const activeSplitIds =
    splitIds.length > 0 ? splitIds : allIds;
  const everyoneSelected = splitIds.length === 0;

  const transfers = useMemo(
    () => suggestedSettlements(trip.memberIds, balances),
    [trip.memberIds, balances],
  );

  const myTransfers = user
    ? transfersForUser(user.uid, transfers)
    : [];

  const hero = user
    ? expenseHeroSummaries(user.uid, transfers, memberName)
    : { youOwe: null, owedToYou: null };

  const settlementLines = useMemo(() => {
    if (!user) return [];
    const lines: {
      key: string;
      label: string;
      initials: string;
      amount: number;
      positive: boolean;
    }[] = [];
    for (const t of myTransfers) {
      if (t.from === user.uid) {
        const nm = memberName(t.to);
        lines.push({
          key: `${t.from}->${t.to}`,
          label: `You owe ${nm}`,
          initials: memberInitials(nm),
          amount: t.amount,
          positive: false,
        });
      } else if (t.to === user.uid) {
        const nm = memberName(t.from);
        lines.push({
          key: `${t.from}->${t.to}`,
          label: `${nm} owes You`,
          initials: memberInitials(nm),
          amount: t.amount,
          positive: true,
        });
      }
    }
    return lines;
  }, [user, myTransfers, members]);

  const total = totalSpent(expenses);
  const recent = showAllRecent ? expenses : expenses.slice(0, 4);

  function toggleEveryone() {
    setSplitIds([]);
  }

  function toggleMember(id: string) {
    if (splitIds.length === 0) {
      setSplitIds([id]);
      return;
    }
    const base = [...splitIds];
    if (base.includes(id)) {
      const next = base.filter((x) => x !== id);
      setSplitIds(next.length === 0 ? [] : next);
    } else {
      setSplitIds([...base, id]);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm ring-1 ring-black/[0.03]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-slate-500">Total Trip Spend</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums tracking-tight text-[#14532d]">
              ${money(total)}
            </p>
          </div>
          <div className="flex h-16 w-24 items-center justify-center rounded-xl bg-slate-100/90 text-slate-300">
            <svg viewBox="0 0 48 32" className="h-8 w-12" fill="none" aria-hidden>
              <path d="M4 24 L12 14 L20 20 L28 8 L36 16 L44 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      </section>

      {user ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div
            className={`rounded-2xl p-4 shadow-sm ring-1 ${
              hero.youOwe
                ? "bg-emerald-50 ring-emerald-100"
                : "bg-slate-50 ring-slate-100"
            }`}
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-900/80">
              You owe
            </p>
            {hero.youOwe ? (
              <p className="mt-2 text-sm font-semibold leading-snug text-emerald-950">
                <span className="text-lg tabular-nums">${money(hero.youOwe.total)}</span>
                <span className="mt-1 block text-xs font-medium text-emerald-900/90">
                  To {formatCounterpartyNames(hero.youOwe.counterparties)}
                </span>
              </p>
            ) : (
              <p className="mt-2 text-sm font-medium text-emerald-900/70">
                You’re not paying anyone right now
              </p>
            )}
          </div>
          <div
            className={`rounded-2xl p-4 shadow-sm ring-1 ${
              hero.owedToYou
                ? "bg-[#14532d] ring-emerald-900/30"
                : "bg-slate-100 ring-slate-200"
            }`}
          >
            <p
              className={`text-[10px] font-bold uppercase tracking-[0.14em] ${
                hero.owedToYou ? "text-emerald-100/90" : "text-slate-500"
              }`}
            >
              Owed to you
            </p>
            {hero.owedToYou ? (
              <p className="mt-2 text-sm font-semibold leading-snug text-white">
                <span className="text-lg tabular-nums">${money(hero.owedToYou.total)}</span>
                <span className="mt-1 block text-xs font-medium text-emerald-100/95">
                  From {formatCounterpartyNames(hero.owedToYou.counterparties)}
                </span>
              </p>
            ) : (
              <p className="mt-2 text-sm font-medium text-slate-500">
                No incoming payments right now
              </p>
            )}
          </div>
        </div>
      ) : null}

      {!closed && user ? (
        <section>
          <h2 className="text-lg font-semibold text-[#14532d]">Add Expense</h2>
          <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-4">
            <label className="flex flex-col gap-2">
              <span className="text-xs font-medium text-slate-600">Amount</span>
              <div className="flex rounded-xl border border-slate-200 bg-white ring-1 ring-black/[0.04] focus-within:ring-2 focus-within:ring-emerald-800/25">
                <span className="flex items-center pl-3 text-slate-500">$</span>
                <input
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="min-h-[48px] flex-1 rounded-r-xl bg-transparent px-2 py-3 text-[#0f172a] outline-none"
                  placeholder="0.00"
                />
              </div>
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-xs font-medium text-slate-600">Paid by</span>
              <select
                value={displayPaidBy}
                onChange={(e) => setPaidBy(e.target.value)}
                className="min-h-[48px] rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[#0f172a] ring-1 ring-black/[0.04] focus:outline-none focus:ring-2 focus:ring-emerald-800/25"
              >
                {members.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.userId === user.uid ? "Me" : m.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-xs font-medium text-slate-600">Category</span>
              <select
                value={
                  EXPENSE_CATEGORIES.includes(category as (typeof EXPENSE_CATEGORIES)[number])
                    ? category
                    : EXPENSE_CATEGORIES[0]!
                }
                onChange={(e) => setCategory(e.target.value)}
                className="min-h-[48px] rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[#0f172a] ring-1 ring-black/[0.04] focus:outline-none focus:ring-2 focus:ring-emerald-800/25"
              >
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <div>
              <p className="text-xs font-medium text-slate-600">Split between</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={toggleEveryone}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition ${
                    everyoneSelected
                      ? "bg-[#14532d] text-white shadow-sm"
                      : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {everyoneSelected ? (
                    <svg className="h-3.5 w-3.5" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                      <path d="M2 6.5 4.5 9 10 3" />
                    </svg>
                  ) : null}
                  Everyone
                </button>
                {members.map((m) => {
                  const on =
                    splitIds.length > 0 && activeSplitIds.includes(m.userId);
                  return (
                    <button
                      key={m.userId}
                      type="button"
                      onClick={() => toggleMember(m.userId)}
                      className={`rounded-full px-3.5 py-2 text-xs font-semibold transition ${
                        on
                          ? "bg-[#14532d] text-white shadow-sm"
                          : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {m.userId === user.uid ? "Me" : m.name}
                    </button>
                  );
                })}
              </div>
            </div>
            {expenseErr ? (
              <p className="text-sm text-red-600" role="alert">
                {expenseErr}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={expenseSaving}
              className="min-h-[52px] w-full rounded-2xl bg-[#14532d] text-sm font-semibold text-white shadow-md shadow-emerald-950/15 transition hover:brightness-110 disabled:opacity-60"
            >
              {expenseSaving ? "Saving…" : "Log Expense"}
            </button>
          </form>
        </section>
      ) : null}

      <section>
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-[#0f172a]">Recent Expenses</h2>
          {expenses.length > 4 ? (
            <button
              type="button"
              onClick={() => setShowAllRecent((v) => !v)}
              className="text-sm font-semibold text-[#14532d] hover:underline"
            >
              {showAllRecent ? "Show less" : "View All"}
            </button>
          ) : null}
        </div>
        <ul className="mt-4 flex flex-col gap-3">
          {recent.length === 0 ? (
            <li className="rounded-2xl border border-dashed border-slate-200 bg-white/80 px-4 py-8 text-center text-sm text-slate-500">
              No expenses yet.
            </li>
          ) : (
            recent.map((ex) => {
              const title =
                ex.note?.trim() ||
                ex.category?.trim() ||
                "Trip expense";
              const cat = ex.category?.trim() || "Expense";
              return (
                <li
                  key={ex.id}
                  className="flex items-stretch gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm ring-1 ring-black/[0.03]"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">
                    <CategoryIcon category={ex.category} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-[#0f172a]">{title}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {cat} · Paid by{" "}
                      {ex.paidBy === user?.uid ? "Me" : memberName(ex.paidBy)}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end justify-between">
                    <span className="text-sm font-semibold tabular-nums text-[#0f172a]">
                      ${money(ex.amount)}
                    </span>
                    {!closed ? (
                      <button
                        type="button"
                        onClick={() => onRemoveExpense(ex)}
                        className="text-slate-400 transition hover:text-red-600"
                        aria-label="Delete expense"
                      >
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                          <path d="M3 6h18M8 6V4h8v2m-1 0v14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V6h8Z" />
                        </svg>
                      </button>
                    ) : null}
                  </div>
                </li>
              );
            })
          )}
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-[#0f172a]">Settlement Summary</h2>
        <ul className="mt-4 space-y-3">
          {settlementLines.length === 0 ? (
            <li className="rounded-2xl border border-slate-100 bg-white px-4 py-6 text-center text-sm text-slate-500 shadow-sm">
              {user
                ? "No transfers needed — balances are settled."
                : "Sign in to see settlements."}
            </li>
          ) : (
            settlementLines.map((row) => (
              <li
                key={row.key}
                className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm ring-1 ring-black/[0.03]"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                    {row.initials}
                  </span>
                  <span className="text-sm font-medium text-[#0f172a]">
                    {row.label}
                  </span>
                </div>
                <span
                  className={`shrink-0 text-sm font-semibold tabular-nums ${
                    row.positive ? "text-emerald-700" : "text-[#9a3412]"
                  }`}
                >
                  {row.positive ? "+" : "−"}${money(row.amount)}
                </span>
              </li>
            ))
          )}
        </ul>
        <button
          type="button"
          className="mt-4 w-full rounded-2xl border-2 border-[#14532d] bg-white py-3 text-sm font-semibold text-[#14532d] transition hover:bg-emerald-50"
          onClick={() => {
            /* placeholder — reminders not wired */
          }}
        >
          Send Settlement Reminder
        </button>
      </section>
    </div>
  );
}
