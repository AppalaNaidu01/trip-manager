"use client";

import { useAuth } from "@/contexts/AuthContext";
import { mapTrip } from "@/lib/firestore-map";
import { getDb } from "@/lib/firebase/client";
import { uploadTripImageToDrive } from "@/lib/google-drive/media-upload";
import { generateInviteToken } from "@/lib/trip-utils";
import {
  collection,
  doc,
  getDoc,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const MAX_COVER_BYTES = 5 * 1024 * 1024;

const labelClass =
  "text-[10px] font-bold uppercase tracking-[0.16em] text-[#14532d]/85";
const fieldClass =
  "mt-2 w-full rounded-2xl border border-slate-200/90 bg-[#f4f4f0] px-4 py-3.5 text-sm text-[#0f172a] shadow-sm ring-1 ring-black/[0.03] placeholder:text-slate-400 focus:border-[#14532d]/35 focus:outline-none focus:ring-2 focus:ring-[#14532d]/18";

function GroupSyncGlyph({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 11v6M19 14h6" />
    </svg>
  );
}

export default function NewTripPage() {
  const { user } = useAuth();
  const router = useRouter();
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [endDate, setEndDate] = useState("");
  const [groupSync, setGroupSync] = useState(true);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!coverFile) {
      setCoverPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(coverFile);
    setCoverPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [coverFile]);

  function onCoverPicked(f: File | undefined) {
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      setError("Cover must be an image file.");
      return;
    }
    if (f.size > MAX_COVER_BYTES) {
      setError("Cover image must be 5 MB or smaller.");
      return;
    }
    setError(null);
    setCoverFile(f);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    const n = name.trim();
    if (!n) {
      setError("Trip name is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const db = getDb();
      const tripRef = doc(collection(db, "trips"));
      const tripId = tripRef.id;
      const inviteToken = generateInviteToken();
      const displayName =
        user.displayName || user.email?.split("@")[0] || "Organizer";
      const batch = writeBatch(db);
      batch.set(tripRef, {
        name: n,
        description: description.trim(),
        startDate,
        ...(endDate.trim() ? { endDate: endDate.trim() } : {}),
        createdBy: user.uid,
        inviteToken,
        memberIds: [user.uid],
        closed: false,
        groupSync,
        createdAt: serverTimestamp(),
      });
      batch.set(doc(db, "inviteLookups", inviteToken), {
        tripId,
        tripName: n,
      });
      batch.set(doc(db, "trips", tripId, "members", user.uid), {
        userId: user.uid,
        name: displayName,
        email: user.email ?? null,
        role: "admin",
        joinedAt: serverTimestamp(),
      });
      await batch.commit();

      const snap = await getDoc(tripRef);
      if (!snap.exists()) throw new Error("Trip was not created.");
      const tripData = mapTrip(tripId, snap.data()!);

      if (coverFile) {
        try {
          const memberEmails = user.email ? [user.email] : [];
          const { url, driveFileId } = await uploadTripImageToDrive({
            trip: tripData,
            tripId,
            file: coverFile,
            nameHint: `cover_${tripId}_${coverFile.name}`,
            memberEmails,
          });
          await updateDoc(tripRef, {
            coverImageUrl: url,
            coverDriveFileId: driveFileId,
            updatedAt: serverTimestamp(),
          });
        } catch (coverErr) {
          console.error(coverErr);
          setError(
            coverErr instanceof Error
              ? `${coverErr.message} Trip was created — add a cover from the trip page.`
              : "Cover upload failed. Trip was created — add a cover from the trip page.",
          );
          router.push(`/trips/${tripId}`);
          return;
        }
      }

      router.push(`/trips/${tripId}`);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to create trip");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-lg">
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold leading-tight tracking-tight text-[#14532d]">
          Start a New Journey
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          Capture the spirit of your next adventure. Define the route, the dates,
          and the memories waiting to happen.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-7">
        <div>
          <label
            htmlFor="new-trip-cover"
            className="relative block aspect-[16/10] w-full cursor-pointer overflow-hidden rounded-3xl bg-gradient-to-br from-slate-200 via-sky-100/80 to-emerald-100/90 shadow-inner ring-1 ring-slate-200/80"
          >
            <input
              id="new-trip-cover"
              ref={coverInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => {
                onCoverPicked(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            {coverPreviewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={coverPreviewUrl}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : null}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute bottom-4 left-4 flex items-center gap-2 text-white drop-shadow-md">
              <svg
                className="h-5 w-5 shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden
              >
                <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                <circle cx="12" cy="13" r="3" />
              </svg>
              <span className="text-[11px] font-bold uppercase tracking-[0.2em]">
                Add trip cover
              </span>
            </div>
          </label>
          {coverFile ? (
            <button
              type="button"
              onClick={() => setCoverFile(null)}
              className="mt-2 text-xs font-medium text-slate-500 underline-offset-2 hover:text-[#14532d] hover:underline"
            >
              Remove selected cover
            </button>
          ) : null}
        </div>

        <label className="flex flex-col">
          <span className={labelClass}>Trip name</span>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={fieldClass}
            placeholder="e.g., Weekend ride to the coast"
            autoComplete="off"
          />
        </label>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <label className="flex min-w-0 flex-col">
            <span className={labelClass}>Start date</span>
            <input
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={`${fieldClass} font-medium [color-scheme:light]`}
            />
          </label>
          <label className="flex min-w-0 flex-col">
            <span className={labelClass}>End date (optional)</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate || undefined}
              className={`${fieldClass} font-medium [color-scheme:light]`}
            />
          </label>
        </div>

        <label className="flex flex-col">
          <span className={labelClass}>Description</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className={`${fieldClass} resize-none leading-relaxed`}
            placeholder="Tell the group about the journey, the sights, and the stops…"
          />
        </label>

        <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm ring-1 ring-black/[0.04]">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-[#14532d] shadow-sm">
            <GroupSyncGlyph className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-[#0f172a]">Group Sync</p>
            <p className="mt-0.5 text-xs leading-snug text-slate-500">
              Allow others to add stops and collaborate on the route.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={groupSync}
            onClick={() => setGroupSync((v) => !v)}
            className={`relative h-8 w-[3.25rem] shrink-0 rounded-full transition-colors ${
              groupSync ? "bg-[#14532d]" : "bg-slate-200"
            }`}
          >
            <span
              className={`absolute top-1 left-1 h-6 w-6 rounded-full bg-white shadow-md transition-transform ${
                groupSync ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {error ? (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={saving}
          className="min-h-[52px] w-full rounded-2xl bg-[#14532d] text-sm font-semibold text-white shadow-md shadow-emerald-950/15 transition hover:brightness-110 disabled:opacity-50"
        >
          {saving ? "Creating…" : "Create trip"}
        </button>
      </form>
    </div>
  );
}
