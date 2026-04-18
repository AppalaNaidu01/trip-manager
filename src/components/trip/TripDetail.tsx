"use client";

import { useAuth } from "@/contexts/AuthContext";
import {
  mapExpense,
  mapMedia,
  mapMember,
  mapTimeline,
  mapTrip,
} from "@/lib/firestore-map";
import { getDb } from "@/lib/firebase/client";
import { computeBalances, formatTripDateRange, totalSpent } from "@/lib/trip-utils";
import type { Expense, MediaItem, TimelineEvent, Trip, TripMember } from "@/types/models";
import {
  collection,
  doc,
  onSnapshot,
  updateDoc,
  writeBatch,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";
import {
  deleteDriveFile,
  tripImageSrcForUi,
} from "@/lib/google-drive/drive-api";
import { getGoogleDriveAccessToken } from "@/lib/google-drive/token";
import { uploadTripImageToDrive } from "@/lib/google-drive/media-upload";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { TripChecklistPanel } from "./TripChecklistPanel";
import { TripImagesPanel } from "./TripImagesPanel";
import { TripRoutePanel } from "./TripRoutePanel";
import { TripTabNav, type TripTabId } from "./TripTabNav";

export function TripDetail() {
  const params = useParams();
  const tripId = params.tripId as string;
  const { user } = useAuth();
  const [tab, setTab] = useState<TripTabId>("overview");

  const [trip, setTrip] = useState<Trip | null>(null);
  const [members, setMembers] = useState<TripMember[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState("");
  const [splitIds, setSplitIds] = useState<string[]>([]);
  const [category, setCategory] = useState("");
  const [expenseSaving, setExpenseSaving] = useState(false);
  const [expenseErr, setExpenseErr] = useState<string | null>(null);

  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState<string | null>(null);

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!tripId) return;
    const db = getDb();
    const tripRef = doc(db, "trips", tripId);
    const unsubTrip = onSnapshot(
      tripRef,
      (snap) => {
        if (!snap.exists()) {
          setTrip(null);
          setLoadError("Trip not found or you do not have access.");
          return;
        }
        setTrip(mapTrip(snap.id, snap.data()));
        setLoadError(null);
      },
      (e) => setLoadError(e.message),
    );
    return () => unsubTrip();
  }, [tripId]);

  useEffect(() => {
    if (!tripId || !trip) return;
    const db = getDb();
    const mCol = collection(db, "trips", tripId, "members");
    const unsub = onSnapshot(mCol, (snap) => {
      const list = snap.docs.map((d) => mapMember(d.id, d.data()));
      list.sort((a, b) => {
        const ta = a.joinedAt?.toMillis?.() ?? 0;
        const tb = b.joinedAt?.toMillis?.() ?? 0;
        return ta - tb;
      });
      setMembers(list);
    });
    return () => unsub();
  }, [tripId, trip]);

  useEffect(() => {
    if (!tripId || !trip) return;
    const db = getDb();
    const eCol = collection(db, "trips", tripId, "expenses");
    const unsub = onSnapshot(query(eCol, orderBy("createdAt", "desc")), (snap) => {
      setExpenses(
        snap.docs.map((d) => mapExpense(d.id, tripId, d.data())),
      );
    });
    return () => unsub();
  }, [tripId, trip]);

  useEffect(() => {
    if (!tripId || !trip) return;
    const db = getDb();
    const medCol = collection(db, "trips", tripId, "media");
    const unsub = onSnapshot(query(medCol, orderBy("createdAt", "desc")), (snap) => {
      setMedia(snap.docs.map((d) => mapMedia(d.id, tripId, d.data())));
    });
    return () => unsub();
  }, [tripId, trip]);

  useEffect(() => {
    if (!tripId || !trip) return;
    const db = getDb();
    const tCol = collection(db, "trips", tripId, "timelineEvents");
    const unsub = onSnapshot(query(tCol, orderBy("createdAt", "desc")), (snap) => {
      setTimeline(
        snap.docs.map((d) => mapTimeline(d.id, tripId, d.data())),
      );
    });
    return () => unsub();
  }, [tripId, trip]);

  const displayPaidBy =
    paidBy || user?.uid || members[0]?.userId || "";

  const activeSplitIds =
    splitIds.length > 0 ? splitIds : members.map((m) => m.userId);

  const balances = useMemo(() => {
    if (!trip) return {};
    return computeBalances(
      trip.memberIds,
      expenses.map((e) => ({
        amount: e.amount,
        paidBy: e.paidBy,
        splitBetween: e.splitBetween,
      })),
    );
  }, [trip, expenses]);

  const inviteUrl = useMemo(() => {
    if (typeof window === "undefined" || !trip) return "";
    return `${window.location.origin}/join/${trip.inviteToken}`;
  }, [trip]);

  const copyInvite = useCallback(async () => {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [inviteUrl]);

  const isAdmin = user && trip && user.uid === trip.createdBy;

  async function addExpense(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !trip || trip.closed) return;
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) {
      setExpenseErr("Enter a valid amount.");
      return;
    }
    const payer = paidBy || user.uid;
    const splits =
      splitIds.length > 0 ? splitIds : members.map((m) => m.userId);
    if (!payer || splits.length === 0) {
      setExpenseErr("Choose who paid and who splits.");
      return;
    }
    setExpenseSaving(true);
    setExpenseErr(null);
    try {
      const db = getDb();
      const batch = writeBatch(db);
      const expRef = doc(collection(db, "trips", tripId, "expenses"));
      const expenseId = expRef.id;
      const tlRef = doc(
        db,
        "trips",
        tripId,
        "timelineEvents",
        `expense_${expenseId}`,
      );
      batch.set(expRef, {
        amount: n,
        paidBy: payer,
        splitBetween: splits,
        ...(category.trim() ? { category: category.trim() } : {}),
        createdAt: serverTimestamp(),
      });
      batch.set(tlRef, {
        type: "expense",
        referenceId: expenseId,
        createdAt: serverTimestamp(),
      });
      await batch.commit();
      setAmount("");
      setCategory("");
    } catch (err) {
      console.error(err);
      setExpenseErr(err instanceof Error ? err.message : "Could not add expense");
    } finally {
      setExpenseSaving(false);
    }
  }

  async function removeExpense(expense: Expense) {
    if (!trip || trip.closed) return;
    if (!confirm("Delete this expense?")) return;
    try {
      const db = getDb();
      const batch = writeBatch(db);
      batch.delete(doc(db, "trips", tripId, "expenses", expense.id));
      batch.delete(
        doc(db, "trips", tripId, "timelineEvents", `expense_${expense.id}`),
      );
      await batch.commit();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Delete failed");
    }
  }

  async function closeTrip() {
    if (!trip || !isAdmin || trip.closed) return;
    if (!confirm("Close this trip? Members can still view balances and media."))
      return;
    try {
      const db = getDb();
      await updateDoc(doc(db, "trips", tripId), { closed: true });
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Could not close trip");
    }
  }

  const memberEmails = useMemo(
    () =>
      members
        .map((m) => m.email)
        .filter((e): e is string => typeof e === "string" && e.length > 0),
    [members],
  );

  async function onPickFile(f: FileList | null) {
    if (!user || !trip || trip.closed || !f?.length) return;
    const file = f[0];
    if (!file.type.startsWith("image/")) {
      setUploadErr("Please choose an image file.");
      return;
    }
    setUploading(true);
    setUploadErr(null);
    try {
      const db = getDb();
      const mediaRef = doc(collection(db, "trips", tripId, "media"));
      const mediaId = mediaRef.id;
      const { url, driveFileId } = await uploadTripImageToDrive({
        trip,
        tripId,
        file,
        nameHint: `photo_${mediaId}_${file.name}`,
        memberEmails,
      });
      const batch = writeBatch(db);
      batch.set(mediaRef, {
        url,
        driveFileId,
        uploadedBy: user.uid,
        createdAt: serverTimestamp(),
      });
      batch.set(
        doc(db, "trips", tripId, "timelineEvents", `media_${mediaId}`),
        {
          type: "media",
          referenceId: mediaId,
          createdAt: serverTimestamp(),
        },
      );
      await batch.commit();
    } catch (err) {
      console.error(err);
      setUploadErr(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function removeMedia(item: MediaItem) {
    if (!trip || trip.closed) return;
    if (!confirm("Remove this photo from the trip?")) return;
    try {
      if (item.driveFileId) {
        const token = await getGoogleDriveAccessToken();
        await deleteDriveFile(token, item.driveFileId);
      }
      const db = getDb();
      const batch = writeBatch(db);
      batch.delete(doc(db, "trips", tripId, "media", item.id));
      batch.delete(
        doc(db, "trips", tripId, "timelineEvents", `media_${item.id}`),
      );
      await batch.commit();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Could not remove");
    }
  }

  if (loadError && !trip) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-900">
        <p>{loadError}</p>
        <Link href="/dashboard" className="mt-4 inline-block text-sm underline">
          Back to trips
        </Link>
      </div>
    );
  }

  if (!trip) {
    return <p className="text-sm text-slate-500">Loading trip…</p>;
  }

  const memberName = (uid: string) =>
    members.find((m) => m.userId === uid)?.name ?? uid.slice(0, 8);

  const coverSrc = tripImageSrcForUi(
    trip.coverDriveFileId,
    trip.coverImageUrl,
  );
  const hasCover = Boolean(coverSrc);

  const backgroundSrc = tripImageSrcForUi(
    trip.backgroundDriveFileId,
    trip.backgroundImageUrl,
  );

  return (
    <div className="relative flex flex-col gap-6 overflow-hidden rounded-2xl sm:gap-8">
      {backgroundSrc ? (
        <>
          <img
            aria-hidden
            src={backgroundSrc}
            alt=""
            referrerPolicy="no-referrer"
            className="pointer-events-none absolute inset-0 z-0 min-h-full w-full object-cover"
          />
          <div
            className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-white/[0.88] to-white/[0.92]"
            aria-hidden
          />
        </>
      ) : null}
      <div className="relative z-10 flex flex-col gap-6 sm:gap-8">
      <div>
        <Link
          href="/dashboard"
          className="text-sm text-slate-500 hover:text-slate-800"
        >
          ← Trips
        </Link>

        <div
          className={`relative mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-emerald-50 to-teal-50 ring-1 ring-black/5 ${
            hasCover ? "min-h-[140px] sm:min-h-[180px]" : "min-h-0"
          }`}
        >
          {hasCover && coverSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverSrc}
              alt=""
              referrerPolicy="no-referrer"
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : null}
          <div
            className={`relative p-4 sm:p-6 ${
              hasCover
                ? "bg-black/45 text-white"
                : "text-[#0f172a]"
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">
                  {trip.name}
                </h1>
                <p className="mt-1 text-sm opacity-90">
                  {formatTripDateRange(trip)}
                </p>
                {trip.description ? (
                  <p
                    className={`mt-3 max-w-2xl text-sm ${
                      hasCover ? "text-white/95" : "text-slate-700"
                    }`}
                  >
                    {trip.description}
                  </p>
                ) : null}
              </div>
              {trip.closed ? (
                <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white backdrop-blur">
                  Closed
                </span>
              ) : isAdmin ? (
                <button
                  type="button"
                  onClick={() => closeTrip()}
                  className="rounded-lg border border-white/40 bg-white/10 px-3 py-1.5 text-xs font-medium text-white backdrop-blur hover:bg-white/20"
                >
                  Close trip
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <TripTabNav active={tab} onChange={setTab} />

      {tab === "overview" && (
        <div className="flex flex-col gap-8">
          {user ? (
            <TripImagesPanel tripId={tripId} trip={trip} user={user} members={members} />
          ) : null}

          <section className="rounded-2xl border border-slate-200 bg-white/95 p-5 ring-1 ring-black/5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Invite link
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Share this link so friends can join after signing in with Google.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <code className="max-w-full flex-1 truncate rounded-lg bg-slate-100 px-3 py-2 text-xs text-[#0f172a]">
                {inviteUrl || "…"}
              </code>
              <button
                type="button"
                onClick={() => copyInvite()}
                className="rounded-lg bg-emerald-800 px-4 py-2 text-xs font-semibold text-white hover:brightness-110"
              >
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white/95 p-5 ring-1 ring-black/5">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <h2 className="text-lg font-semibold text-[#0f172a]">
                Balances snapshot
              </h2>
              <button
                type="button"
                onClick={() => setTab("expenses")}
                className="text-sm font-medium text-emerald-800 hover:underline"
              >
                View expenses
              </button>
            </div>
            <p className="mt-1 text-sm text-slate-600">
              Total spent:{" "}
              <strong>{totalSpent(expenses).toFixed(2)}</strong>
            </p>
            <ul className="mt-3 space-y-1 text-sm">
              {trip.memberIds.slice(0, 5).map((uid) => (
                <li key={uid} className="flex justify-between gap-4">
                  <span>{memberName(uid)}</span>
                  <span
                    className={
                      (balances[uid] ?? 0) >= 0
                        ? "text-emerald-800"
                        : "text-red-700"
                    }
                  >
                    {(balances[uid] ?? 0).toFixed(2)}
                  </span>
                </li>
              ))}
              {trip.memberIds.length > 5 ? (
                <li className="text-xs text-slate-500">…</li>
              ) : null}
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#0f172a]">Timeline</h2>
            <ol className="mt-4 space-y-3 border-l-2 border-slate-200 pl-4">
              {timeline.map((ev) => (
                <li key={ev.id} className="relative text-sm">
                  <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-emerald-800" />
                  <TimelineLine
                    ev={ev}
                    expenses={expenses}
                    media={media}
                    members={members}
                    memberName={memberName}
                  />
                  <time className="mt-0.5 block text-xs text-slate-500">
                    {ev.createdAt?.toDate
                      ? ev.createdAt.toDate().toLocaleString()
                      : ""}
                  </time>
                </li>
              ))}
            </ol>
            {timeline.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">No activity yet.</p>
            ) : null}
          </section>
        </div>
      )}

      {tab === "expenses" && (
        <section className="rounded-2xl border border-slate-200 bg-white/95 p-5 ring-1 ring-black/5">
          <h2 className="text-lg font-semibold text-[#0f172a]">Expenses</h2>
          <p className="mt-1 text-sm text-slate-600">
            Equal split across selected members. Total:{" "}
            <strong>{totalSpent(expenses).toFixed(2)}</strong>
          </p>
          {!trip.closed && user ? (
            <form onSubmit={addExpense} className="mt-4 flex flex-col gap-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1 text-sm">
                  <span>Amount</span>
                  <input
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="rounded-lg border border-slate-300/80 bg-white px-3 py-2 text-[#0f172a] shadow-sm ring-1 ring-black/5"
                    placeholder="0.00"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span>Paid by</span>
                  <select
                    value={displayPaidBy}
                    onChange={(e) => setPaidBy(e.target.value)}
                    className="rounded-lg border border-slate-300/80 bg-white px-3 py-2 text-[#0f172a] shadow-sm ring-1 ring-black/5"
                  >
                    {members.map((m) => (
                      <option key={m.userId} value={m.userId}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <fieldset>
                <legend className="text-sm font-medium">Split between</legend>
                <div className="mt-2 flex flex-wrap gap-3">
                  {members.map((m) => (
                    <label key={m.userId} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={activeSplitIds.includes(m.userId)}
                        onChange={(e) => {
                          const base =
                            splitIds.length > 0
                              ? [...splitIds]
                              : members.map((x) => x.userId);
                          if (e.target.checked) {
                            setSplitIds([...new Set([...base, m.userId])]);
                          } else {
                            setSplitIds(base.filter((id) => id !== m.userId));
                          }
                        }}
                      />
                      {m.name}
                    </label>
                  ))}
                </div>
              </fieldset>
              <label className="flex flex-col gap-1 text-sm">
                <span>Category (optional)</span>
                <input
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="rounded-lg border border-slate-300/80 bg-white px-3 py-2 text-[#0f172a] shadow-sm ring-1 ring-black/5"
                  placeholder="Fuel, food, stay…"
                />
              </label>
              {expenseErr ? (
                <p className="text-sm text-red-600">{expenseErr}</p>
              ) : null}
              <button
                type="submit"
                disabled={expenseSaving}
                className="w-fit rounded-2xl bg-[#0f172a] px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
              >
                {expenseSaving ? "Saving…" : "Add expense"}
              </button>
            </form>
          ) : null}

          <ul className="mt-6 divide-y divide-slate-200">
            {expenses.map((ex) => (
              <li
                key={ex.id}
                className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
              >
                <div>
                  <span className="font-medium">{ex.amount.toFixed(2)}</span>
                  <span className="text-slate-500">
                    {" "}
                    · paid by {memberName(ex.paidBy)}
                    {ex.category ? ` · ${ex.category}` : ""}
                  </span>
                </div>
                {!trip.closed ? (
                  <button
                    type="button"
                    onClick={() => removeExpense(ex)}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                ) : null}
              </li>
            ))}
          </ul>

          <div className="mt-6 border-t border-slate-200 pt-4">
            <h3 className="text-sm font-semibold text-[#0f172a]">Balances</h3>
            <p className="mt-1 text-xs text-slate-500">
              Positive means others owe this person; negative means they owe the
              group.
            </p>
            <ul className="mt-3 space-y-1 text-sm">
              {trip.memberIds.map((uid) => (
                <li key={uid} className="flex justify-between gap-4">
                  <span>{memberName(uid)}</span>
                  <span
                    className={
                      (balances[uid] ?? 0) >= 0
                        ? "text-emerald-800"
                        : "text-red-700"
                    }
                  >
                    {(balances[uid] ?? 0).toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {tab === "photos" && (
        <section className="rounded-2xl border border-slate-200 bg-white/95 p-5 ring-1 ring-black/5">
          <h2 className="text-lg font-semibold text-[#0f172a]">Photos</h2>
          {!trip.closed && user ? (
            <div className="mt-3">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-slate-300/80 bg-white/80 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => onPickFile(e.target.files)}
                />
                {uploading ? "Uploading…" : "Upload photo"}
              </label>
              {uploadErr ? (
                <p className="mt-2 text-sm text-red-600">{uploadErr}</p>
              ) : null}
            </div>
          ) : null}
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {media.map((m) => (
              <figure
                key={m.id}
                className="group relative overflow-hidden rounded-lg border border-slate-200"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={tripImageSrcForUi(m.driveFileId, m.url) ?? m.url}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="aspect-square w-full object-cover"
                  loading="lazy"
                />
                {!trip.closed ? (
                  <button
                    type="button"
                    onClick={() => removeMedia(m)}
                    className="absolute right-2 top-2 rounded bg-black/60 px-2 py-0.5 text-xs text-white opacity-0 transition group-hover:opacity-100"
                  >
                    Remove
                  </button>
                ) : null}
              </figure>
            ))}
          </div>
        </section>
      )}

      {tab === "route" && user ? (
        <TripRoutePanel tripId={tripId} trip={trip} user={user} />
      ) : null}

      {tab === "checklist" && user ? (
        <div className="rounded-2xl border border-slate-200 bg-white/95 p-5 ring-1 ring-black/5">
          <TripChecklistPanel
            tripId={tripId}
            trip={trip}
            user={user}
            members={members}
          />
        </div>
      ) : null}

      {tab === "members" && (
        <section>
          <h2 className="text-lg font-semibold text-[#0f172a]">Members</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {members.map((m) => (
              <li
                key={m.userId}
                className="rounded-full border border-slate-200 bg-white/95 px-3 py-1 text-sm ring-1 ring-black/5"
              >
                {m.name}
                {m.role === "admin" ? (
                  <span className="ml-1 text-xs text-emerald-800">(admin)</span>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      )}
      </div>
    </div>
  );
}

function TimelineLine({
  ev,
  expenses,
  media,
  members,
  memberName,
}: {
  ev: TimelineEvent;
  expenses: Expense[];
  media: MediaItem[];
  members: TripMember[];
  memberName: (uid: string) => string;
}) {
  if (ev.type === "expense") {
    const ex = expenses.find((e) => e.id === ev.referenceId);
    return (
      <span>
        Expense: <strong>{ex ? ex.amount.toFixed(2) : "…"}</strong>
        {ex ? ` · paid by ${memberName(ex.paidBy)}` : ""}
      </span>
    );
  }
  if (ev.type === "media") {
    const item = media.find((m) => m.id === ev.referenceId);
    return (
      <span>
        Photo added{item ? ` by ${memberName(item.uploadedBy)}` : ""}
      </span>
    );
  }
  const joined = members.find((m) => m.userId === ev.referenceId);
  return (
    <span>
      <strong>{joined?.name ?? "Someone"}</strong> joined the trip
    </span>
  );
}
