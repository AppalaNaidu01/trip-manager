"use client";

import { getDb } from "@/lib/firebase/client";
import { memberInitials } from "@/lib/trip-utils";
import type { Trip, TripMember } from "@/types/models";
import type { User } from "firebase/auth";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useState } from "react";

const AVATAR_PALETTES = [
  "bg-emerald-100 text-emerald-900 ring-emerald-200/80",
  "bg-rose-100 text-rose-800 ring-rose-200/80",
  "bg-amber-100 text-amber-900 ring-amber-200/80",
  "bg-sky-100 text-sky-900 ring-sky-200/80",
  "bg-violet-100 text-violet-900 ring-violet-200/80",
  "bg-teal-100 text-teal-900 ring-teal-200/80",
] as const;

function avatarPalette(uid: string): string {
  let h = 0;
  for (let i = 0; i < uid.length; i++) {
    h = (h * 31 + uid.charCodeAt(i)) | 0;
  }
  return AVATAR_PALETTES[Math.abs(h) % AVATAR_PALETTES.length]!;
}

function memberSubtitle(m: TripMember): string {
  if (m.email && m.email.includes("@")) return m.email;
  const slug = m.name
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
  return `@${slug || "traveler"}`;
}

function LinkGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M10 13a5 5 0 0 1 7.54.54l3 3a5 5 0 0 1-7.07 7.07l-1.72-1.71" />
      <path d="M14 11a5 5 0 0 1-7.54-.54l-3-3a5 5 0 0 1 7.07-7.07l1.71 1.71" />
    </svg>
  );
}

export function TripMembersPanel({
  tripId,
  trip,
  user,
  members,
  inviteUrl,
  copied,
  onCopyInvite,
}: {
  tripId: string;
  trip: Trip;
  user: User | null;
  members: TripMember[];
  inviteUrl: string;
  copied: boolean;
  onCopyInvite: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [reminderSending, setReminderSending] = useState(false);
  const closed = trip.closed === true;

  async function sendMemberReminder() {
    if (!user || closed) return;
    if (!confirm("Notify everyone about this trip’s members list?")) return;
    setReminderSending(true);
    try {
      const db = getDb();
      await addDoc(collection(db, "trips", tripId, "memberReminders"), {
        createdBy: user.uid,
        createdAt: serverTimestamp(),
      });
    } finally {
      setReminderSending(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <section
        id="trip-invite"
        className="rounded-[1.75rem] border border-slate-100 bg-white p-5 shadow-sm ring-1 ring-black/[0.04]"
      >
        <div className="flex gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-[#14532d]">
            <LinkGlyph className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold text-[#14532d]">Invite link</h2>
            <p className="mt-0.5 text-sm text-slate-500">
              Share this link to invite travelers
            </p>
            <div className="mt-4 flex flex-wrap items-stretch gap-2 rounded-2xl bg-slate-50/90 p-1 ring-1 ring-slate-200/80">
              <code className="min-h-[44px] min-w-0 flex-1 truncate rounded-xl bg-white px-3 py-2.5 text-[11px] leading-relaxed text-slate-700">
                {inviteUrl || "…"}
              </code>
              <button
                type="button"
                onClick={onCopyInvite}
                className="shrink-0 rounded-xl bg-[#14532d] px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:brightness-110"
              >
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-[#14532d]">
            Travelers{" "}
            <span className="text-sm font-medium text-slate-400">
              {members.length}
            </span>
          </h2>
          <button
            type="button"
            onClick={onCopyInvite}
            className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-xs font-semibold text-[#14532d] ring-1 ring-emerald-100 transition hover:bg-emerald-100/80"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 11v6M19 14h6" />
            </svg>
            Add member
          </button>
        </div>

        {user && !closed ? (
          <button
            type="button"
            onClick={() => void sendMemberReminder()}
            disabled={reminderSending}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-[#14532d]/35 bg-white py-3 text-sm font-semibold text-[#14532d] shadow-sm transition hover:border-[#14532d]/55 hover:bg-emerald-50/60 disabled:opacity-60"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {reminderSending ? "Sending…" : "Reminder"}
          </button>
        ) : null}

        <ul className="mt-6 flex flex-col gap-3">
          {members.map((m) => (
            <li
              key={m.userId}
              className="relative rounded-2xl border border-slate-100 bg-white p-4 shadow-sm ring-1 ring-black/[0.03]"
            >
              <div className="flex items-start gap-3">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-sm font-bold ring-2 ring-white ${avatarPalette(m.userId)}`}
                >
                  {memberInitials(m.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-[#0f172a]">{m.name}</span>
                    {m.role === "admin" ? (
                      <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#14532d] ring-1 ring-emerald-100">
                        Admin
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-0.5 truncate text-sm text-slate-500">
                    {memberSubtitle(m)}
                  </p>
                </div>
                <div className="relative shrink-0">
                  {m.email ? (
                    <button
                      type="button"
                      onClick={() =>
                        setMenuOpen((id) => (id === m.userId ? null : m.userId))
                      }
                      className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                      aria-label="Member actions"
                    >
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                        <circle cx="12" cy="6" r="1.5" />
                        <circle cx="12" cy="12" r="1.5" />
                        <circle cx="12" cy="18" r="1.5" />
                      </svg>
                    </button>
                  ) : (
                    <span className="inline-block h-9 w-9" aria-hidden />
                  )}
                  {menuOpen === m.userId && m.email ? (
                    <>
                      <button
                        type="button"
                        className="fixed inset-0 z-10 cursor-default"
                        aria-label="Close menu"
                        onClick={() => setMenuOpen(null)}
                      />
                      <div className="absolute right-0 top-full z-20 mt-1 min-w-[10rem] rounded-xl border border-slate-200 bg-white py-1 shadow-lg ring-1 ring-black/5">
                        <button
                          type="button"
                          className="w-full px-4 py-2.5 text-left text-sm font-medium text-slate-800 hover:bg-slate-50"
                          onClick={() => {
                            void navigator.clipboard.writeText(m.email!);
                            setMenuOpen(null);
                          }}
                        >
                          Copy email
                        </button>
                      </div>
                    </>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
