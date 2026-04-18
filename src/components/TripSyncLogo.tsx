"use client";

import Link from "next/link";
import { TripSyncMark } from "@/components/TripSyncMark";

export function TripSyncLogo({ href = "/" }: { href?: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 text-emerald-800 transition hover:opacity-90"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-800 text-white shadow-sm">
        <TripSyncMark className="h-5 w-5" />
      </span>
      <span className="text-lg font-bold tracking-tight">TripSync</span>
    </Link>
  );
}
