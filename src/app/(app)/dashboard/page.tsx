"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useDashboardSearch } from "@/contexts/DashboardSearchContext";
import { docSnapToTrip } from "@/lib/firestore-map";
import { getDb } from "@/lib/firebase/client";
import {
  formatRelativeFirestore,
  formatTripDateRangeShort,
  tripListEmoji,
  tripListGradientClass,
} from "@/lib/trip-utils";
import { tripImageSrcForUi } from "@/lib/google-drive/drive-api";
import type { Trip } from "@/types/models";
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

function PeopleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { query } = useDashboardSearch();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [error, setError] = useState<string | null>(null);

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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return trips;
    return trips.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q),
    );
  }, [trips, query]);

  return (
    <div className="flex w-full flex-col">
      {error && (
        <div
          className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
          role="alert"
        >
          <p className="font-medium">Could not load trips</p>
          <p className="mt-1 opacity-90">{error}</p>
          <p className="mt-2 text-xs">
            If this mentions an index, create the composite index from the link in
            the browser console, or in Firebase Console → Firestore → Indexes.
          </p>
        </div>
      )}

      {filtered.length === 0 && !error ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-slate-500">
            {trips.length === 0
              ? "No trips yet."
              : "No trips match your search."}
          </p>
          {trips.length === 0 ? (
            <p className="mt-2 text-sm text-slate-400">
              Tap the + button to create one.
            </p>
          ) : null}
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {filtered.map((t) => {
            const when = formatRelativeFirestore(t.updatedAt ?? t.createdAt);
            const emoji = tripListEmoji(t.id);
            const grad = tripListGradientClass(t.id);
            const sub =
              t.description.trim() ||
              (t.closed ? "Trip closed" : "Open to see activity");
            const thumbSrc = tripImageSrcForUi(
              t.coverDriveFileId,
              t.coverImageUrl,
            );
            return (
              <li key={t.id}>
                <Link
                  href={`/trips/${t.id}`}
                  className="block py-4 transition-colors hover:bg-slate-50/80 active:bg-slate-100/80"
                >
                  <div className="flex gap-3">
                    <div
                      className={`relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br ${grad} text-2xl shadow-inner ring-2 ring-white`}
                    >
                      {thumbSrc ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={thumbSrc}
                          alt=""
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      ) : (
                        <span aria-hidden>{emoji}</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h2 className="font-semibold leading-tight text-[#0f172a]">
                          {t.name}
                          {t.closed ? (
                            <span className="ml-1.5 text-xs font-normal text-slate-400">
                              · closed
                            </span>
                          ) : null}
                        </h2>
                        {when ? (
                          <time
                            className="shrink-0 text-xs text-slate-400"
                            dateTime={
                              t.updatedAt?.toDate?.()?.toISOString() ??
                              t.createdAt?.toDate?.()?.toISOString()
                            }
                          >
                            {when}
                          </time>
                        ) : null}
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-sm text-slate-500">
                        {sub}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <CalendarIcon className="h-3.5 w-3.5 opacity-80" />
                          {formatTripDateRangeShort(t)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <PeopleIcon className="h-3.5 w-3.5 opacity-80" />
                          {t.memberIds.length}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
