"use client";

import { tripImageSrcForUi } from "@/lib/google-drive/drive-api";
import type { MediaItem, Trip } from "@/types/models";
import type { User } from "firebase/auth";
import type { RefObject } from "react";

function tileMinHeightClass(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) | 0;
  }
  const r = Math.abs(h) % 5;
  const heights = ["min-h-[148px]", "min-h-[200px]", "min-h-[176px]", "min-h-[228px]", "min-h-[164px]"];
  return heights[r] ?? "min-h-[180px]";
}

export function TripPhotosPanel({
  trip,
  media,
  user,
  closed,
  uploading,
  uploadErr,
  fileInputRef,
  onPickFile,
  onRemoveMedia,
}: {
  trip: Trip;
  media: MediaItem[];
  user: User | null;
  closed: boolean;
  uploading: boolean;
  uploadErr: string | null;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onPickFile: (files: FileList | null) => void;
  onRemoveMedia: (item: MediaItem) => void;
}) {
  const n = trip.memberIds.length;

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-[#14532d]">
          Our Memories
        </h2>
        <p className="mt-1.5 text-sm text-slate-500">
          Shared by {n} participant{n === 1 ? "" : "s"}
        </p>
      </div>

      <div className="columns-2 gap-x-3 sm:columns-3 sm:gap-x-4">
        {!closed && user ? (
          <label className="mb-3 block cursor-pointer break-inside-avoid rounded-[1.75rem] border-2 border-dashed border-slate-300/90 bg-[#f7f7f4] p-4 text-center transition hover:border-[#14532d]/40 hover:bg-emerald-50/50">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploading}
              onChange={(e) => onPickFile(e.target.files)}
            />
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#14532d] text-white shadow-md shadow-emerald-950/20">
              {uploading ? (
                <span className="text-xs font-semibold">…</span>
              ) : (
                <svg
                  className="h-7 w-7"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  aria-hidden
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
              )}
            </span>
            <span className="mt-3 block text-xs font-semibold text-[#14532d]">
              {uploading ? "Uploading…" : "Upload Photo"}
            </span>
          </label>
        ) : null}

        {media.map((m) => {
          const src = tripImageSrcForUi(m.driveFileId, m.url) ?? m.url;
          const mh = tileMinHeightClass(m.id);
          return (
            <figure
              key={m.id}
              className={`group relative mb-3 break-inside-avoid overflow-hidden rounded-[1.75rem] border border-slate-100 bg-slate-100 shadow-sm ring-1 ring-black/[0.04] ${mh}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt=""
                referrerPolicy="no-referrer"
                className="h-full min-h-[inherit] w-full object-cover"
                loading="lazy"
              />
              {!closed ? (
                <button
                  type="button"
                  onClick={() => onRemoveMedia(m)}
                  className="absolute right-2 top-2 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-medium text-white opacity-0 backdrop-blur-sm transition group-hover:opacity-100"
                >
                  Remove
                </button>
              ) : null}
            </figure>
          );
        })}
      </div>

      {uploadErr ? (
        <p className="text-sm text-red-600" role="alert">
          {uploadErr}
        </p>
      ) : null}
    </section>
  );
}
