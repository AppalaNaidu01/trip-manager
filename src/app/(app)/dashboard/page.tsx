"use client";

import { useAuth } from "@/contexts/AuthContext";
import { docSnapToTrip, mapMember } from "@/lib/firestore-map";
import { tripImageSrcForUi } from "@/lib/google-drive/drive-api";
import {
  formatMonthYear,
  formatTripDateRangeCard,
  memberInitials,
  tripListEmoji,
  tripListGradientClass,
  tripTimelineKind,
} from "@/lib/trip-utils";
import { getDb } from "@/lib/firebase/client";
import type { Trip, TripMember } from "@/types/models";
import {
  collection,
  onSnapshot,
  query as firestoreQuery,
  where,
} from "firebase/firestore";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function stackInitials(
  memberIds: string[],
  members: TripMember[] | undefined,
): string[] {
  const byId = new Map((members ?? []).map((m) => [m.userId, m.name]));
  return memberIds.slice(0, 3).map((uid) => {
    const name = byId.get(uid);
    if (name?.trim()) return memberInitials(name);
    return uid.slice(0, 2).toUpperCase();
  });
}

function MemberStack({
  memberIds,
  members,
}: {
  memberIds: string[];
  members: TripMember[] | undefined;
}) {
  const count = memberIds.length;
  const n = Math.min(3, Math.max(0, count));
  const rings = [
    "bg-amber-200 text-amber-950",
    "bg-sky-200 text-sky-950",
    "bg-emerald-200 text-emerald-950",
  ];
  const initials = stackInitials(memberIds, members);
  return (
    <div className="flex items-center">
      <div className="flex -space-x-2">
        {Array.from({ length: n }).map((_, i) => (
          <div
            key={`${memberIds[i]}-${i}`}
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-white text-[10px] font-bold tabular-nums ${rings[i % 3]}`}
            aria-hidden
          >
            {initials[i] ?? "?"}
          </div>
        ))}
      </div>
      {count > 3 ? (
        <span className="ml-2 rounded-full bg-emerald-800 px-2 py-0.5 text-[11px] font-bold text-white">
          +{count - 3}
        </span>
      ) : null}
    </div>
  );
}

function FeaturedTripCard({
  trip,
  kind,
  members,
}: {
  trip: Trip;
  kind: "current" | "planned";
  members: TripMember[] | undefined;
}) {
  const thumbSrc = tripImageSrcForUi(trip.coverDriveFileId, trip.coverImageUrl);
  const emoji = tripListEmoji(trip.id);
  const grad = tripListGradientClass(trip.id);

  return (
    <Link
      href={`/trips/${trip.id}`}
      className="block overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/80 transition hover:shadow-md"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
        {thumbSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbSrc}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div
            className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${grad} text-4xl`}
          >
            <span aria-hidden>{emoji}</span>
          </div>
        )}
        {kind === "planned" ? (
          <span className="absolute right-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-800 shadow-sm ring-1 ring-slate-200/80">
            Planned
          </span>
        ) : null}
      </div>
      <div className="p-4">
        {kind === "current" ? (
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-emerald-600">
            Current adventure
          </p>
        ) : null}
        <h3
          className={`font-bold leading-snug text-slate-900 ${kind === "current" ? "mt-1" : ""}`}
        >
          {trip.name}
        </h3>
        <p className="mt-2 flex items-center gap-2 text-sm text-slate-600">
          <CalendarIcon className="h-4 w-4 shrink-0 opacity-80" />
          {formatTripDateRangeCard(trip)}
        </p>
        <div className="mt-4 flex items-center justify-between gap-2">
          <MemberStack memberIds={trip.memberIds} members={members} />
          <ChevronRightIcon className="h-5 w-5 shrink-0 text-slate-300" />
        </div>
      </div>
    </Link>
  );
}

function MemoryRow({ trip }: { trip: Trip }) {
  const thumbSrc = tripImageSrcForUi(trip.coverDriveFileId, trip.coverImageUrl);
  const emoji = tripListEmoji(trip.id);
  const grad = tripListGradientClass(trip.id);
  const endOrStart = trip.endDate || trip.startDate;

  return (
    <Link
      href={`/trips/${trip.id}`}
      className="flex items-center gap-3 rounded-xl py-3 transition hover:bg-white/80"
    >
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-100 ring-1 ring-slate-200/80">
        {thumbSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbSrc}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div
            className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${grad} text-xl`}
          >
            <span aria-hidden>{emoji}</span>
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold leading-tight text-slate-900">{trip.name}</p>
        <p className="mt-1 text-sm text-slate-500">
          {formatMonthYear(endOrStart)} • {trip.memberIds.length} Members
        </p>
      </div>
      <span className="shrink-0 text-lg font-bold leading-none text-slate-300">
        ⋮
      </span>
    </Link>
  );
}

function tripMatchesSearchQuery(t: Trip, raw: string): boolean {
  const trimmed = raw.trim().toLowerCase();
  if (!trimmed) return true;
  const terms = trimmed.split(/\s+/).filter(Boolean);
  const name = (t.name ?? "").toLowerCase();
  const desc = (t.description ?? "").toLowerCase();
  const id = t.id.toLowerCase();
  const dates = formatTripDateRangeCard(t).toLowerCase();
  return terms.every(
    (term) =>
      name.includes(term) ||
      desc.includes(term) ||
      id.includes(term) ||
      dates.includes(term),
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [trips, setTrips] = useState<Trip[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [membersByTrip, setMembersByTrip] = useState<
    Record<string, TripMember[]>
  >({});

  useEffect(() => {
    if (!user) return;
    const db = getDb();
    const q = firestoreQuery(
      collection(db, "trips"),
      where("memberIds", "array-contains", user.uid),
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map(docSnapToTrip);
        list.sort((a, b) => {
          const ta = a.updatedAt?.toMillis?.() ?? a.createdAt?.toMillis?.() ?? 0;
          const tb = b.updatedAt?.toMillis?.() ?? b.createdAt?.toMillis?.() ?? 0;
          return tb - ta;
        });
        setTrips(list);
        setError(null);
      },
      (err) => {
        console.error(err);
        setError(err.message);
      },
    );
    return () => unsub();
  }, [user]);

  const tripIdsKey = [...trips].map((t) => t.id).sort().join(",");

  useEffect(() => {
    if (!user) {
      setMembersByTrip({});
      return;
    }
    const ids = tripIdsKey.split(",").filter(Boolean);
    if (ids.length === 0) {
      setMembersByTrip({});
      return;
    }
    const db = getDb();
    const idSet = new Set(ids);
    setMembersByTrip((prev) => {
      const next = { ...prev };
      for (const k of Object.keys(next)) {
        if (!idSet.has(k)) delete next[k];
      }
      return next;
    });
    const unsubs: (() => void)[] = [];
    for (const tripId of ids) {
      const col = collection(db, "trips", tripId, "members");
      unsubs.push(
        onSnapshot(col, (snap) => {
          const list = snap.docs.map((d) => mapMember(d.id, d.data()));
          list.sort((a, b) => {
            const ta = a.joinedAt?.toMillis?.() ?? 0;
            const tb = b.joinedAt?.toMillis?.() ?? 0;
            return ta - tb;
          });
          setMembersByTrip((prev) => ({ ...prev, [tripId]: list }));
        }),
      );
    }
    return () => {
      unsubs.forEach((u) => u());
    };
  }, [user, tripIdsKey]);

  const filtered = useMemo(() => {
    return trips.filter((t) => tripMatchesSearchQuery(t, searchQuery));
  }, [trips, searchQuery]);

  const { currentTrips, plannedTrips, pastTrips } = useMemo(() => {
    const current: Trip[] = [];
    const planned: Trip[] = [];
    const past: Trip[] = [];
    for (const t of filtered) {
      const k = tripTimelineKind(t);
      if (k === "current") current.push(t);
      else if (k === "planned") planned.push(t);
      else past.push(t);
    }
    current.sort((a, b) =>
      (a.startDate || "").localeCompare(b.startDate || ""),
    );
    planned.sort((a, b) =>
      (a.startDate || "").localeCompare(b.startDate || ""),
    );
    past.sort((a, b) => {
      const ae = a.endDate || a.startDate || "";
      const be = b.endDate || b.startDate || "";
      return be.localeCompare(ae);
    });
    return {
      currentTrips: current,
      plannedTrips: planned,
      pastTrips: past,
    };
  }, [filtered]);

  return (
    <div className="flex w-full min-w-0 flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          My Trips
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Your upcoming and past adventures curated in one place.
        </p>
        <label className="sr-only" htmlFor="dashboard-trip-search">
          Search trips
        </label>
        <input
          id="dashboard-trip-search"
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          autoComplete="off"
          placeholder="Search trips..."
          className="mt-5 w-full rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm outline-none ring-0 placeholder:text-slate-400 focus:border-emerald-300 focus:ring-2 focus:ring-emerald-200"
        />
      </div>

      {error ? (
        <div
          className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
          role="alert"
        >
          <p className="font-medium">Could not load trips</p>
          <p className="mt-1 opacity-90">{error}</p>
        </div>
      ) : null}

      <Link
        href="/trips/new"
        className="mb-10 block overflow-hidden rounded-2xl bg-emerald-800 p-5 text-white shadow-lg shadow-emerald-900/20 ring-1 ring-emerald-900/20 transition hover:brightness-[1.03]"
      >
        <h2 className="text-lg font-bold">Start a New Journey</h2>
        <p className="mt-1 text-sm leading-relaxed text-emerald-50/95">
          Coordinate with friends, manage itineraries, and share memories
          effortlessly.
        </p>
        <span className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-emerald-800 shadow-sm">
          <PlusIcon className="h-4 w-4" />
          Create Trip
        </span>
      </Link>

      {filtered.length === 0 && !error ? (
        <p className="text-center text-sm text-slate-500">
          {trips.length === 0
            ? "No trips yet. Start a new journey above."
            : "No trips match your search."}
        </p>
      ) : null}

      <div className="flex flex-col gap-5">
        {currentTrips.map((t) => (
          <FeaturedTripCard
            key={t.id}
            trip={t}
            kind="current"
            members={membersByTrip[t.id]}
          />
        ))}
        {plannedTrips.map((t) => (
          <FeaturedTripCard
            key={t.id}
            trip={t}
            kind="planned"
            members={membersByTrip[t.id]}
          />
        ))}
      </div>

      {pastTrips.length > 0 ? (
        <>
          <div className="relative my-10">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-[#F9F9F7] px-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                More memories
              </span>
            </div>
          </div>
          <ul className="flex flex-col divide-y divide-slate-200/80">
            {pastTrips.map((t) => (
              <li key={t.id}>
                <MemoryRow trip={t} />
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}
