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
import { useCallback, useEffect, useMemo, useState } from "react";
import type { RefObject } from "react";

const selectClass =
  "mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-[#0f172a] shadow-sm ring-1 ring-black/[0.04] outline-none focus:ring-2 focus:ring-[#14532d]/25";

function ChevronIcon({ dir }: { dir: "left" | "right" }) {
  return (
    <svg
      className="h-7 w-7"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {dir === "left" ? <path d="m15 18-6-6 6-6" /> : <path d="m9 18 6-6-6-6" />}
    </svg>
  );
}

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

  /** Flat list in on-screen order (for lightbox prev/next). */
  const viewerOrder = useMemo(() => {
    const ordered: MediaItem[] = [];
    for (const key of visibleKeys) {
      if (photosSegmentFilter != null && photosSegmentFilter !== key) continue;
      const items = buckets.get(key);
      if (items?.length) ordered.push(...items);
    }
    return ordered;
  }, [visibleKeys, buckets, photosSegmentFilter]);

  const [viewerMediaId, setViewerMediaId] = useState<string | null>(null);

  const viewerIndex = useMemo(() => {
    if (!viewerMediaId) return -1;
    return viewerOrder.findIndex((m) => m.id === viewerMediaId);
  }, [viewerMediaId, viewerOrder]);

  const closeViewer = useCallback(() => setViewerMediaId(null), []);

  const goNext = useCallback(() => {
    if (viewerOrder.length <= 1 || viewerIndex < 0) return;
    const next = (viewerIndex + 1) % viewerOrder.length;
    const item = viewerOrder[next];
    if (item) setViewerMediaId(item.id);
  }, [viewerOrder, viewerIndex]);

  const goPrev = useCallback(() => {
    if (viewerOrder.length <= 1 || viewerIndex < 0) return;
    const prev =
      (viewerIndex - 1 + viewerOrder.length) % viewerOrder.length;
    const item = viewerOrder[prev];
    if (item) setViewerMediaId(item.id);
  }, [viewerOrder, viewerIndex]);

  useEffect(() => {
    if (viewerMediaId && viewerIndex < 0) {
      setViewerMediaId(null);
    }
  }, [viewerMediaId, viewerIndex]);

  useEffect(() => {
    if (!viewerMediaId) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        closeViewer();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewerMediaId, closeViewer, goNext, goPrev]);

  useEffect(() => {
    if (!viewerMediaId) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [viewerMediaId]);

  const openViewer = useCallback((item: MediaItem) => {
    setViewerMediaId(item.id);
  }, []);

  const viewerItem =
    viewerIndex >= 0 ? viewerOrder[viewerIndex] : undefined;
  const viewerSrc = viewerItem
    ? (tripImageSrcForUi(viewerItem.driveFileId, viewerItem.url) ??
      viewerItem.url)
    : "";

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
                    return (
                      <figure
                        key={m.id}
                        className="group relative mb-3 break-inside-avoid overflow-hidden rounded-[1.75rem] border border-slate-100 bg-slate-100 shadow-sm ring-1 ring-black/[0.04]"
                      >
                        <button
                          type="button"
                          onClick={() => openViewer(m)}
                          className="block w-full cursor-zoom-in text-left leading-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#14532d]/40 focus-visible:ring-offset-2"
                          aria-label="Open photo"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={src}
                            alt=""
                            referrerPolicy="no-referrer"
                            className="block h-auto w-full max-w-full"
                            loading="lazy"
                          />
                        </button>
                        {!closed ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onRemoveMedia(m);
                            }}
                            className="absolute right-2 top-2 z-[1] rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-medium text-white opacity-0 backdrop-blur-sm transition group-hover:opacity-100"
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

      {viewerItem && viewerMediaId ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/92 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Photo viewer"
          onClick={closeViewer}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              closeViewer();
            }}
            className="absolute right-3 top-3 z-[102] rounded-full bg-white/10 p-2.5 text-white backdrop-blur-sm transition hover:bg-white/20"
            aria-label="Close"
          >
            <svg
              className="h-6 w-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>

          {viewerOrder.length > 1 ? (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  goPrev();
                }}
                className="absolute left-1 top-1/2 z-[102] -translate-y-1/2 rounded-full bg-white/10 p-3 text-white backdrop-blur-sm transition hover:bg-white/20 sm:left-4"
                aria-label="Previous photo"
              >
                <ChevronIcon dir="left" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  goNext();
                }}
                className="absolute right-1 top-1/2 z-[102] -translate-y-1/2 rounded-full bg-white/10 p-3 text-white backdrop-blur-sm transition hover:bg-white/20 sm:right-4"
                aria-label="Next photo"
              >
                <ChevronIcon dir="right" />
              </button>
            </>
          ) : null}

          <div
            className="relative z-[101] flex max-h-[min(88vh,100%)] max-w-[min(96vw,100%)] flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={viewerSrc}
              alt=""
              referrerPolicy="no-referrer"
              className="max-h-[min(88vh,100%)] max-w-full object-contain"
            />
            {viewerOrder.length > 1 ? (
              <p className="mt-3 text-center text-sm font-medium text-white/80">
                {viewerIndex + 1} / {viewerOrder.length}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
