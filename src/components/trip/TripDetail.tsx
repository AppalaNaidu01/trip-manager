"use client";

import { useTripChrome } from "@/contexts/TripChromeContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  mapExpense,
  mapMedia,
  mapMember,
  mapTimeline,
  mapTrip,
} from "@/lib/firestore-map";
import { getDb } from "@/lib/firebase/client";
import {
  balanceNarrative,
  computeBalances,
  formatTripDateHeroPill,
  memberInitials,
  totalSpent,
} from "@/lib/trip-utils";
import type {
  Expense,
  MediaItem,
  TimelineEvent,
  Trip,
  TripMember,
} from "@/types/models";
import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  writeBatch,
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
  useRef,
  useState,
} from "react";
import { TripChecklistPanel } from "./TripChecklistPanel";
import { TripExpensesPanel } from "./TripExpensesPanel";
import { TripMembersPanel } from "./TripMembersPanel";
import { TripImagesPanel } from "./TripImagesPanel";
import { TripPhotosPanel } from "./TripPhotosPanel";
import { TripRoutePanel } from "./TripRoutePanel";
import { TripTabNav, type TripTabId } from "./TripTabNav";

export function TripDetail() {
  const params = useParams();
  const tripId = params.tripId as string;
  const { user } = useAuth();
  const { setChrome } = useTripChrome();
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
  const [category, setCategory] = useState("Dining");
  const [expenseSaving, setExpenseSaving] = useState(false);
  const [expenseErr, setExpenseErr] = useState<string | null>(null);

  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState<string | null>(null);

  const [copied, setCopied] = useState(false);
  const [tripBroadcast, setTripBroadcast] = useState<{
    kind: "checklist" | "members";
    fromUid: string;
  } | null>(null);
  const broadcastSkipRef = useRef({ checklist: true, members: true });

  const photoFileInputRef = useRef<HTMLInputElement>(null);
  const triggerPhotoUpload = useCallback(() => {
    photoFileInputRef.current?.click();
  }, []);

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

  useEffect(() => {
    if (!tripId || !user) return;
    broadcastSkipRef.current.checklist = true;
    const db = getDb();
    const q = query(
      collection(db, "trips", tripId, "checklistReminders"),
      orderBy("createdAt", "desc"),
      limit(40),
    );
    const unsub = onSnapshot(q, (snap) => {
      if (broadcastSkipRef.current.checklist) {
        broadcastSkipRef.current.checklist = false;
        return;
      }
      for (const ch of snap.docChanges()) {
        if (ch.type !== "added") continue;
        const from = ch.doc.data().createdBy as string | undefined;
        if (from && from !== user.uid) {
          setTripBroadcast({ kind: "checklist", fromUid: from });
          break;
        }
      }
    });
    return () => unsub();
  }, [tripId, user]);

  useEffect(() => {
    if (!tripId || !user) return;
    broadcastSkipRef.current.members = true;
    const db = getDb();
    const q = query(
      collection(db, "trips", tripId, "memberReminders"),
      orderBy("createdAt", "desc"),
      limit(40),
    );
    const unsub = onSnapshot(q, (snap) => {
      if (broadcastSkipRef.current.members) {
        broadcastSkipRef.current.members = false;
        return;
      }
      for (const ch of snap.docChanges()) {
        if (ch.type !== "added") continue;
        const from = ch.doc.data().createdBy as string | undefined;
        if (from && from !== user.uid) {
          setTripBroadcast({ kind: "members", fromUid: from });
          break;
        }
      }
    });
    return () => unsub();
  }, [tripId, user]);

  useEffect(() => {
    if (!trip) {
      setChrome(null);
      return;
    }
    const subtitle = formatTripDateHeroPill(trip);
    setChrome({
      title: tab === "members" ? "Trip Members" : trip.name,
      subtitle: tab === "members" ? "" : subtitle || "",
      headerRight:
        tab === "photos" && user
          ? "camera"
          : tab === "members" && user
            ? "invitePeople"
            : "menu",
      onCamera: triggerPhotoUpload,
      onInvitePeople: copyInvite,
    });
    return () => setChrome(null);
  }, [trip, tab, user, setChrome, triggerPhotoUpload, copyInvite]);

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
        category: category.trim() || "Other",
        createdAt: serverTimestamp(),
      });
      batch.set(tlRef, {
        type: "expense",
        referenceId: expenseId,
        createdAt: serverTimestamp(),
      });
      await batch.commit();
      setAmount("");
      setCategory("Dining");
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

  return (
    <div className="relative flex flex-col gap-6 overflow-hidden rounded-2xl sm:gap-8">
      <div className="relative z-10 flex flex-col gap-6 sm:gap-8">
        <div
          className={`relative mt-1 overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-br from-emerald-50 to-teal-50 shadow-sm ring-1 ring-black/5 ${
            (tab === "photos" ||
              tab === "route" ||
              tab === "checklist" ||
              tab === "members") &&
              hasCover
              ? "min-h-[240px] sm:min-h-[300px]"
              : hasCover
                ? "min-h-[220px] sm:min-h-[280px]"
                : tab === "photos" ||
                    tab === "route" ||
                    tab === "checklist" ||
                    tab === "members"
                  ? "min-h-[200px] sm:min-h-[240px]"
                  : "min-h-[160px]"
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
          {hasCover && coverSrc ? (
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/10" />
          ) : null}
          <div
            className={`relative flex min-h-[inherit] flex-col justify-end p-5 sm:p-7 ${
              hasCover ? "text-white" : "text-[#0f172a]"
            }`}
          >
            {tab === "photos" ||
            tab === "route" ||
            tab === "checklist" ||
            tab === "members" ? (
              <>
                <h1
                  className={`text-3xl font-bold leading-tight tracking-tight sm:text-[2rem] ${
                    hasCover && coverSrc ? "text-white drop-shadow-md" : ""
                  }`}
                >
                  {trip.name}
                </h1>
                {formatTripDateHeroPill(trip) ? (
                  <p
                    className={`mt-3 inline-flex items-center gap-2 text-sm font-medium ${
                      hasCover && coverSrc ? "text-white/95 drop-shadow" : "text-slate-600"
                    }`}
                  >
                    <CalendarMiniIcon
                      className={
                        hasCover && coverSrc ? "text-white/90" : "text-emerald-800"
                      }
                    />
                    <span className="uppercase tracking-[0.08em]">
                      {formatTripDateHeroPill(trip)}
                    </span>
                  </p>
                ) : null}
              </>
            ) : (
              <>
                {formatTripDateHeroPill(trip) ? (
                  <p
                    className={`mb-3 inline-flex w-fit rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${
                      hasCover && coverSrc
                        ? "bg-white/25 text-white backdrop-blur-md"
                        : "bg-emerald-100 text-emerald-900"
                    }`}
                  >
                    {formatTripDateHeroPill(trip)}
                  </p>
                ) : null}
                <h1
                  className={`text-3xl font-bold leading-tight tracking-tight sm:text-[2rem] ${
                    hasCover && coverSrc ? "text-white drop-shadow-md" : ""
                  }`}
                >
                  {trip.name}
                </h1>
                {trip.description ? (
                  <p
                    className={`mt-3 max-w-2xl text-sm leading-relaxed ${
                      hasCover && coverSrc ? "text-white/95" : "text-slate-600"
                    }`}
                  >
                    {trip.description}
                  </p>
                ) : null}
              </>
            )}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {trip.closed ? (
                <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white backdrop-blur">
                  Closed
                </span>
              ) : isAdmin ? (
                <button
                  type="button"
                  onClick={() => closeTrip()}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium backdrop-blur ${
                    hasCover && coverSrc
                      ? "border border-white/40 bg-white/15 text-white hover:bg-white/25"
                      : "border border-slate-300 bg-white text-slate-800"
                  }`}
                >
                  Close trip
                </button>
              ) : null}
            </div>
          </div>
        </div>

        <TripTabNav active={tab} onChange={setTab} />

        {tab === "overview" && (
          <div className="flex flex-col gap-8">
            {user ? (
              <TripImagesPanel
                tripId={tripId}
                trip={trip}
                user={user}
                members={members}
              />
            ) : null}

            <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
              <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                Invite link
              </h2>
              <div className="mt-4 flex flex-wrap items-stretch gap-2 rounded-2xl bg-slate-50/90 p-1 ring-1 ring-slate-200/80">
                <code className="min-h-[44px] min-w-0 flex-1 truncate rounded-xl bg-white px-3 py-2.5 text-[11px] leading-relaxed text-slate-700">
                  {inviteUrl || "…"}
                </code>
                <button
                  type="button"
                  onClick={() => copyInvite()}
                  className="shrink-0 rounded-xl bg-emerald-800 px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:brightness-110"
                >
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
              <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-900">
                Balances snapshot
              </h2>
              <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-medium text-slate-500">
                    Total Trip Spend
                  </p>
                  <p className="mt-1 text-4xl font-semibold tabular-nums text-slate-900">
                    ${totalSpent(expenses).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-emerald-800 ring-1 ring-emerald-100">
                  {trip.memberIds.length} members
                </span>
              </div>
              <ul className="mt-8 space-y-5 border-t border-slate-100 pt-6">
                {trip.memberIds.map((uid) => {
                  const bal = balances[uid] ?? 0;
                  const m = members.find((x) => x.userId === uid);
                  const label = m?.name ?? memberName(uid);
                  return (
                    <li key={uid} className="flex items-center gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700 ring-2 ring-white">
                        {memberInitials(label)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-900">{label}</p>
                        <p className="text-xs text-slate-500">
                          {balanceNarrative(uid, members, balances)}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 text-sm font-semibold tabular-nums ${
                          bal >= 0 ? "text-emerald-700" : "text-red-600"
                        }`}
                      >
                        {bal > 0
                          ? "+"
                          : bal < 0
                            ? "−"
                            : ""}
                        $
                        {Math.abs(bal).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>

            <section>
              <div className="flex items-end justify-between gap-2">
                <h2 className="text-xl font-semibold text-[#0f172a]">
                  Timeline
                </h2>
                <button
                  type="button"
                  onClick={() => setTab("photos")}
                  className="text-sm font-medium text-emerald-800 hover:underline"
                >
                  View Journal
                </button>
              </div>
              <ol className="relative mt-6 space-y-8 border-l border-slate-200 pl-6">
                {timeline.slice(0, 12).map((ev) => {
                  const t = ev.createdAt?.toDate?.();
                  const timeLabel = t
                    ? t.toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })
                    : "";
                  return (
                    <li key={ev.id} className="relative">
                      <span className="absolute -left-[29px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-700 shadow-sm" />
                      {ev.type === "expense" ? (
                        <OverviewExpenseRow
                          expense={expenses.find((e) => e.id === ev.referenceId)}
                          memberName={memberName}
                        />
                      ) : ev.type === "media" ? (
                        <OverviewMediaRow
                          item={media.find((m) => m.id === ev.referenceId)}
                          memberName={memberName}
                        />
                      ) : (
                        <p className="text-sm text-slate-800">
                          <TimelineLine
                            ev={ev}
                            expenses={expenses}
                            media={media}
                            members={members}
                            memberName={memberName}
                          />
                        </p>
                      )}
                      <time className="mt-1 block text-xs text-slate-400">
                        {timeLabel}
                      </time>
                    </li>
                  );
                })}
              </ol>
              {timeline.length === 0 ? (
                <p className="mt-4 text-sm text-slate-500">No activity yet.</p>
              ) : null}
            </section>
          </div>
        )}

      {tab === "expenses" && (
        <TripExpensesPanel
          trip={trip}
          user={user}
          members={members}
          expenses={expenses}
          balances={balances}
          amount={amount}
          setAmount={setAmount}
          paidBy={paidBy}
          setPaidBy={setPaidBy}
          splitIds={splitIds}
          setSplitIds={setSplitIds}
          category={category}
          setCategory={setCategory}
          expenseSaving={expenseSaving}
          expenseErr={expenseErr}
          onSubmit={addExpense}
          onRemoveExpense={removeExpense}
        />
      )}

      {tab === "photos" ? (
        <TripPhotosPanel
          trip={trip}
          media={media}
          user={user}
          closed={trip.closed === true}
          uploading={uploading}
          uploadErr={uploadErr}
          fileInputRef={photoFileInputRef}
          onPickFile={onPickFile}
          onRemoveMedia={removeMedia}
        />
      ) : null}

      {tab === "route" ? (
        <TripRoutePanel
          tripId={tripId}
          trip={trip}
          user={user}
          photoCount={media.length}
          onOpenPhotos={() => setTab("photos")}
        />
      ) : null}

      {tab === "checklist" ? (
        <TripChecklistPanel
          tripId={tripId}
          trip={trip}
          user={user}
          members={members}
        />
      ) : null}

      {tab === "members" ? (
        <TripMembersPanel
          tripId={tripId}
          trip={trip}
          user={user}
          members={members}
          inviteUrl={inviteUrl}
          copied={copied}
          onCopyInvite={copyInvite}
        />
      ) : null}
      </div>

      {tripBroadcast ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="trip-broadcast-title"
        >
          <div className="w-full max-w-sm rounded-[1.75rem] border border-slate-100 bg-white p-6 shadow-2xl shadow-slate-900/20 ring-1 ring-black/5">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-[#14532d]">
              <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </div>
            <h2
              id="trip-broadcast-title"
              className="mt-4 text-center text-lg font-semibold text-[#0f172a]"
            >
              {tripBroadcast.kind === "checklist"
                ? "Checklist reminder"
                : "Trip members"}
            </h2>
            <p className="mt-2 text-center text-sm leading-relaxed text-slate-600">
              <span className="font-medium text-[#14532d]">
                {memberName(tripBroadcast.fromUid)}
              </span>{" "}
              {tripBroadcast.kind === "checklist"
                ? "asked everyone to review the packing list."
                : "nudged everyone about this trip’s travelers."}
            </p>
            <button
              type="button"
              onClick={() => setTripBroadcast(null)}
              className="mt-6 w-full rounded-2xl bg-[#14532d] py-3 text-sm font-semibold text-white shadow-md transition hover:brightness-110"
            >
              OK
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function CalendarMiniIcon({ className }: { className?: string }) {
  return (
    <svg
      className={`h-4 w-4 shrink-0 ${className ?? ""}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

function OverviewExpenseRow({
  expense,
  memberName,
}: {
  expense: Expense | undefined;
  memberName: (uid: string) => string;
}) {
  if (!expense) {
    return (
      <p className="text-sm text-slate-500">Expense (details unavailable)</p>
    );
  }
  const title =
    expense.note?.trim() ||
    expense.category?.trim() ||
    "Trip expense";
  return (
    <div>
      <p className="text-sm text-slate-800">
        Expense added by{" "}
        <span className="font-medium">{memberName(expense.paidBy)}</span>
      </p>
      <div className="mt-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm ring-1 ring-slate-100">
        <p className="text-xs font-medium text-slate-900">{title}</p>
        <p className="mt-0.5 text-sm font-semibold text-red-600">
          ${expense.amount.toFixed(2)}
        </p>
      </div>
    </div>
  );
}

function OverviewMediaRow({
  item,
  memberName,
}: {
  item: MediaItem | undefined;
  memberName: (uid: string) => string;
}) {
  const src = item
    ? tripImageSrcForUi(item.driveFileId, item.url) ?? item.url
    : undefined;
  return (
    <div>
      <p className="text-sm text-slate-800">
        Photo added by{" "}
        <span className="font-medium">
          {item ? memberName(item.uploadedBy) : "…"}
        </span>
      </p>
      {src ? (
        <div className="mt-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt=""
            referrerPolicy="no-referrer"
            className="h-20 w-20 rounded-lg object-cover ring-1 ring-slate-200"
          />
        </div>
      ) : null}
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
