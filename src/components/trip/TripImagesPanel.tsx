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
  const [bgBusy, setBgBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const closed = trip.closed === true;

  const coverSrc = tripImageSrcForUi(
    trip.coverDriveFileId,
    trip.coverImageUrl,
  );
  const backgroundSrc = tripImageSrcForUi(
    trip.backgroundDriveFileId,
    trip.backgroundImageUrl,
  );

  const memberEmails = useMemo(
    () =>
      members
        .map((m) => m.email)
        .filter((e): e is string => typeof e === "string" && e.length > 0),
    [members],
  );

  async function upload(
    file: File,
    kind: "cover" | "background",
    setBusy: (v: boolean) => void,
  ) {
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
    setBusy(true);
    try {
      const prefix = kind === "cover" ? "cover" : "background";
      const { url, driveFileId } = await uploadTripImageToDrive({
        trip,
        tripId,
        file,
        nameHint: `${prefix}_${Date.now()}_${file.name}`,
        memberEmails,
      });
      const db = getDb();
      const field = kind === "cover" ? "coverImageUrl" : "backgroundImageUrl";
      const idField =
        kind === "cover" ? "coverDriveFileId" : "backgroundDriveFileId";
      await updateDoc(doc(db, "trips", tripId), {
        [field]: url,
        [idField]: driveFileId,
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  async function clearField(field: "coverImageUrl" | "backgroundImageUrl") {
    if (!user || closed) return;
    setErr(null);
    try {
      const idField =
        field === "coverImageUrl" ? "coverDriveFileId" : "backgroundDriveFileId";
      const fileId =
        field === "coverImageUrl"
          ? trip.coverDriveFileId
          : trip.backgroundDriveFileId;
      if (fileId) {
        const token = await getGoogleDriveAccessToken();
        await deleteDriveFile(token, fileId);
      }
      const db = getDb();
      await updateDoc(doc(db, "trips", tripId), {
        [field]: null,
        [idField]: null,
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not remove image");
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white/95 p-5 ring-1 ring-black/5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
        Trip look
      </h2>
      <p className="mt-2 text-sm text-slate-600">
        Cover appears on cards and the trip header. Background styles the trip
        dashboard. Images are stored in your Google Drive (trip folder).
      </p>
      {err ? (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {err}
        </p>
      ) : null}
      <div className="mt-4 grid gap-6 sm:grid-cols-2">
        <div>
          <p className="text-xs font-medium text-slate-600">Cover image</p>
          <div className="mt-2 aspect-[16/9] overflow-hidden rounded-lg border border-slate-200 bg-gradient-to-br from-emerald-100 to-slate-200">
            {coverSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={coverSrc}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : null}
          </div>
          {!closed && user ? (
            <div className="mt-2 flex flex-wrap gap-2">
              <label className="cursor-pointer rounded-lg border border-dashed border-slate-300/80 bg-white/80 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={coverBusy}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    e.target.value = "";
                    if (f) void upload(f, "cover", setCoverBusy);
                  }}
                />
                {coverBusy ? "Uploading…" : "Upload / replace"}
              </label>
              {coverSrc ? (
                <button
                  type="button"
                  onClick={() => clearField("coverImageUrl")}
                  className="text-xs text-red-600 hover:underline"
                >
                  Remove
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
        <div>
          <p className="text-xs font-medium text-slate-600">Background image</p>
          <div className="mt-2 aspect-video overflow-hidden rounded-lg border border-slate-200 bg-gradient-to-br from-emerald-50/80 to-slate-200">
            {backgroundSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={backgroundSrc}
                alt=""
                className="h-full w-full object-cover opacity-90"
              />
            ) : null}
          </div>
          {!closed && user ? (
            <div className="mt-2 flex flex-wrap gap-2">
              <label className="cursor-pointer rounded-lg border border-dashed border-slate-300/80 bg-white/80 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={bgBusy}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    e.target.value = "";
                    if (f) void upload(f, "background", setBgBusy);
                  }}
                />
                {bgBusy ? "Uploading…" : "Upload / replace"}
              </label>
              {backgroundSrc ? (
                <button
                  type="button"
                  onClick={() => clearField("backgroundImageUrl")}
                  className="text-xs text-red-600 hover:underline"
                >
                  Remove
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
