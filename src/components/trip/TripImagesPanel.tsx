"use client";

import { getDb } from "@/lib/firebase/client";
import {
  deleteDriveFile,
  tripImageSrcForUi,
} from "@/lib/google-drive/drive-api";
import { uploadTripImageToDrive } from "@/lib/google-drive/media-upload";
import { getGoogleDriveAccessToken } from "@/lib/google-drive/token";
import type { Trip, TripMember } from "@/types/models";
import type { User } from "firebase/auth";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { useMemo, useState } from "react";

const MAX_BYTES = 5 * 1024 * 1024;

function ImageIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="m21 15-5-5L5 21" />
    </svg>
  );
}

export function TripImagesPanel({
  tripId,
  trip,
  user,
  members,
}: {
  tripId: string;
  trip: Trip;
  user: User | null;
  members: TripMember[];
}) {
  const [coverBusy, setCoverBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const closed = trip.closed === true;

  const coverSrc = tripImageSrcForUi(
    trip.coverDriveFileId,
    trip.coverImageUrl,
  );

  const memberEmails = useMemo(
    () =>
      members
        .map((m) => m.email)
        .filter((e): e is string => typeof e === "string" && e.length > 0),
    [members],
  );

  async function uploadCover(file: File) {
    if (!user || closed) return;
    if (!file.type.startsWith("image/")) {
      setErr("Please choose an image file.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setErr("Image must be 5 MB or smaller.");
      return;
    }
    setErr(null);
    setCoverBusy(true);
    try {
      const { url, driveFileId } = await uploadTripImageToDrive({
        trip,
        tripId,
        file,
        nameHint: `cover_${Date.now()}_${file.name}`,
        memberEmails,
      });
      const db = getDb();
      await updateDoc(doc(db, "trips", tripId), {
        coverImageUrl: url,
        coverDriveFileId: driveFileId,
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setCoverBusy(false);
    }
  }

  async function clearCover() {
    if (!user || closed) return;
    setErr(null);
    try {
      if (trip.coverDriveFileId) {
        const token = await getGoogleDriveAccessToken();
        await deleteDriveFile(token, trip.coverDriveFileId);
      }
      const db = getDb();
      await updateDoc(doc(db, "trips", tripId), {
        coverImageUrl: null,
        coverDriveFileId: null,
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not remove image");
    }
  }

  return (
    <section>
      <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-900">
        Trip look
      </h2>
      <p className="mt-2 text-xs leading-relaxed text-slate-500">
        Cover is stored in your Google Drive trip folder.
      </p>
      {err ? (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {err}
        </p>
      ) : null}

      <label className="group relative mt-5 block aspect-[16/10] cursor-pointer overflow-hidden rounded-2xl ring-1 ring-slate-200/90">
        <input
          type="file"
          accept="image/*"
          className="hidden"
          disabled={closed || !user || coverBusy}
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f) void uploadCover(f);
          }}
        />
        {coverSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverSrc}
            alt=""
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover blur-[2px] brightness-90 transition group-hover:blur-none group-hover:brightness-100"
          />
        ) : (
          <div className="flex h-full min-h-[140px] w-full flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
            <ImageIcon className="h-10 w-10 text-slate-400" />
          </div>
        )}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/35 p-2 text-center transition group-hover:bg-black/25">
          <ImageIcon className="h-7 w-7 text-white drop-shadow" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-white drop-shadow">
            {coverBusy ? "…" : "Edit cover"}
          </span>
        </div>
      </label>

      {!closed && user && coverSrc ? (
        <div className="mt-3 flex justify-center">
          <button
            type="button"
            onClick={() => clearCover()}
            className="text-[11px] font-medium text-red-600 hover:underline"
          >
            Remove cover
          </button>
        </div>
      ) : null}
    </section>
  );
}
