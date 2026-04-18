"use client";

import { useAuth } from "@/contexts/AuthContext";
import {
  mapExpense,
  mapMedia,
  mapMember,
  mapTimeline,
  mapTrip,
} from "@/lib/firestore-map";
import { getDb, getFirebaseStorage } from "@/lib/firebase/client";
import { computeBalances, totalSpent } from "@/lib/trip-utils";
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
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

export function TripDetail() {
  const params = useParams();
  const tripId = params.tripId as string;
  const { user } = useAuth();

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
      const storage = getFirebaseStorage();
      const mediaRef = doc(collection(db, "trips", tripId, "media"));
      const mediaId = mediaRef.id;
      const path = `trips/${tripId}/${mediaId}_${file.name.replace(/\s+/g, "_")}`;
      const sRef = storageRef(storage, path);
      await uploadBytes(sRef, file);
      const url = await getDownloadURL(sRef);
      const batch = writeBatch(db);
      batch.set(mediaRef, {
        url,
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
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
        <p>{loadError}</p>
        <Link href="/dashboard" className="mt-4 inline-block text-sm underline">
          Back to trips
        </Link>
      </div>
    );
  }

  if (!trip) {
    return <p className="text-sm text-zinc-500">Loading trip…</p>;
  }

  const memberName = (uid: string) =>
    members.find((m) => m.userId === uid)?.name ?? uid.slice(0, 8);

  return (
    <div className="flex flex-col gap-10">
      <div>
        <Link
          href="/dashboard"
          className="text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
        >
          ← Trips
        </Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              {trip.name}
            </h1>
            <p className="mt-1 text-sm text-zinc-500">{trip.date}</p>
            {trip.description ? (
              <p className="mt-3 max-w-2xl text-zinc-700 dark:text-zinc-300">
                {trip.description}
              </p>
            ) : null}
          </div>
          {trip.closed ? (
            <span className="rounded-full bg-zinc-200 px-3 py-1 text-xs font-medium text-zinc-800 dark:bg-zinc-700 dark:text-zinc-200">
              Closed
            </span>
          ) : isAdmin ? (
            <button
              type="button"
              onClick={() => closeTrip()}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Close trip
            </button>
          ) : null}
        </div>
      </div>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Invite link
        </h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Share this link so friends can join after signing in with Google.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <code className="max-w-full flex-1 truncate rounded-lg bg-zinc-100 px-3 py-2 text-xs text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
            {inviteUrl || "…"}
          </code>
          <button
            type="button"
            onClick={() => copyInvite()}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500"
          >
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Members
        </h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {members.map((m) => (
            <li
              key={m.userId}
              className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            >
              {m.name}
              {m.role === "admin" ? (
                <span className="ml-1 text-xs text-emerald-700 dark:text-emerald-400">
                  (admin)
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Expenses
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
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
                  className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950"
                  placeholder="0.00"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span>Paid by</span>
                <select
                  value={displayPaidBy}
                  onChange={(e) => setPaidBy(e.target.value)}
                  className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950"
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
                className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950"
                placeholder="Fuel, food, stay…"
              />
            </label>
            {expenseErr ? (
              <p className="text-sm text-red-600">{expenseErr}</p>
            ) : null}
            <button
              type="submit"
              disabled={expenseSaving}
              className="w-fit rounded-full bg-zinc-900 px-5 py-2 text-sm font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"
            >
              {expenseSaving ? "Saving…" : "Add expense"}
            </button>
          </form>
        ) : null}

        <ul className="mt-6 divide-y divide-zinc-200 dark:divide-zinc-800">
          {expenses.map((ex) => (
            <li
              key={ex.id}
              className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
            >
              <div>
                <span className="font-medium">{ex.amount.toFixed(2)}</span>
                <span className="text-zinc-500">
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

        <div className="mt-6 border-t border-zinc-200 pt-4 dark:border-zinc-800">
          <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
            Balances
          </h3>
          <p className="mt-1 text-xs text-zinc-500">
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
                      ? "text-emerald-700 dark:text-emerald-400"
                      : "text-red-700 dark:text-red-400"
                  }
                >
                  {(balances[uid] ?? 0).toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Photos
        </h2>
        {!trip.closed && user ? (
          <div className="mt-3">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-zinc-300 px-4 py-3 text-sm hover:bg-zinc-50 dark:border-zinc-600 dark:hover:bg-zinc-800">
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
              className="group relative overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={m.url}
                alt=""
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

      <section>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Timeline
        </h2>
        <ol className="mt-4 space-y-3 border-l-2 border-zinc-200 pl-4 dark:border-zinc-700">
          {timeline.map((ev) => (
            <li key={ev.id} className="relative text-sm">
              <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-emerald-500" />
              <TimelineLine
                ev={ev}
                expenses={expenses}
                media={media}
                members={members}
                memberName={memberName}
              />
              <time className="mt-0.5 block text-xs text-zinc-500">
                {ev.createdAt?.toDate
                  ? ev.createdAt.toDate().toLocaleString()
                  : ""}
              </time>
            </li>
          ))}
        </ol>
        {timeline.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500">No activity yet.</p>
        ) : null}
      </section>
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
