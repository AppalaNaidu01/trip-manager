"use client";

import { tripImageSrcForUi } from "@/lib/google-drive/drive-api";
import {
  labelForRouteSegmentId,
  mediaGroupKey,
  orderedSegmentKeys,
  routeSegmentOptionsForUpload,
  ROUTE_SEGMENT_LEGACY_KEY,
} from "@/lib/route-segments";
import type { MediaItem, Trip, TripRoute } from "@/types/models";
import type { User } from "firebase/auth";
import { useEffect, useMemo, useState } from "react";
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

const selectClass =
  "mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-[#0f172a] shadow-sm ring-1 ring-black/[0.04] outline-none focus:ring-2 focus:ring-[#14532d]/25";

export function TripPhotosPanel({
  trip,
  route,
  media,
  user,
  closed,
  uploading,
  uploadErr,
  fileInputRef,
  photosSegmentFilter,
  onPhotosSegmentFilterChange,
  onPickFile,
  onRemoveMedia,
}: {
  trip: Trip;
  route: TripRoute | null;
  media: MediaItem[];
  user: User | null;
  closed: boolean;
  uploading: boolean;
  uploadErr: string | null;
  fileInputRef: RefObject<HTMLInputElement | null>;
  /** When set, only that checkpoint’s photos are shown (from Route tab). */
  photosSegmentFilter: string | null;
  onPhotosSegmentFilterChange: (segmentId: string | null) => void;
  onPickFile: (files: FileList | null, routeSegmentId: string) => void;
  onRemoveMedia: (item: MediaItem) => void;
}) {
  const n = trip.memberIds.length;
  const uploadOptions = useMemo(() => routeSegmentOptionsForUpload(route), [route]);

  const [uploadSegmentId, setUploadSegmentId] = useState(uploadOptions[0]?.id ?? ROUTE_SEGMENT_LEGACY_KEY);

  useEffect(() => {
    const ids = new Set(uploadOptions.map((o) => o.id));
    if (!ids.has(uploadSegmentId)) {
      setUploadSegmentId(uploadOptions[0]?.id ?? ROUTE_SEGMENT_LEGACY_KEY);
    }
  }, [uploadOptions, uploadSegmentId]);

  const buckets = useMemo(() => {
    const map = new Map<string, MediaItem[]>();
    for (const m of media) {
      const k = mediaGroupKey(m.routeSegmentId);
      const list = map.get(k) ?? [];
      list.push(m);
      map.set(k, list);
    }
    return map;
  }, [media]);

  const segmentOrder = useMemo(() => orderedSegmentKeys(route), [route]);

  const visibleKeys = useMemo(() => {
    const keys = segmentOrder.filter((k) => (buckets.get(k)?.length ?? 0) > 0);
    for (const k of buckets.keys()) {
      if (!keys.includes(k)) keys.push(k);
    }
    return keys;
  }, [buckets, segmentOrder]);

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

      {!closed && user ? (
        <div className="rounded-[1.75rem] border border-slate-200/90 bg-[#f7f7f4] p-4 ring-1 ring-black/[0.04]">
          <label className="block text-xs font-semibold uppercase tracking-wide text-[#14532d]">
            Link new uploads to a route checkpoint
          </label>
          <p className="mt-1 text-xs text-slate-500">
            Photos appear under that stop on this tab and in Route.
          </p>
          <select
            className={selectClass}
            value={uploadSegmentId}
            onChange={(e) => setUploadSegmentId(e.target.value)}
            disabled={uploading}
            aria-label="Route checkpoint for uploads"
          >
            {uploadOptions.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
          <label className="mt-4 block cursor-pointer text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploading}
              onChange={(e) => onPickFile(e.target.files, uploadSegmentId)}
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
        </div>
      ) : null}

      {visibleKeys.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onPhotosSegmentFilterChange(null)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
              photosSegmentFilter == null
                ? "bg-[#14532d] text-white shadow-sm"
                : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
            }`}
          >
            All
          </button>
          {segmentOrder.map((key) => {
            const count = buckets.get(key)?.length ?? 0;
            if (count === 0) return null;
            const label = labelForRouteSegmentId(key, route);
            const active = photosSegmentFilter === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => onPhotosSegmentFilterChange(key)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                  active
                    ? "bg-[#14532d] text-white shadow-sm"
                    : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
                }`}
              >
                {label}
                <span className="ml-1 opacity-80">({count})</span>
              </button>
            );
          })}
        </div>
      ) : null}

      {media.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500">
          No photos yet. Choose a checkpoint above, then upload.
        </p>
      ) : (
        <div className="flex flex-col gap-10">
          {visibleKeys.map((key) => {
            if (photosSegmentFilter != null && photosSegmentFilter !== key) {
              return null;
            }
            const items = buckets.get(key);
            if (!items?.length) return null;
            const heading = labelForRouteSegmentId(key, route);
            return (
              <div key={key}>
                <h3 className="mb-3 text-sm font-bold text-[#14532d]">{heading}</h3>
                <div className="columns-2 gap-x-3 sm:columns-3 sm:gap-x-4">
                  {items.map((m) => {
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
              </div>
            );
          })}
        </div>
      )}

      {uploadErr ? (
        <p className="text-sm text-red-600" role="alert">
          {uploadErr}
        </p>
      ) : null}
    </section>
  );
}
