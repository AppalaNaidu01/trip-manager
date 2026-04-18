"use client";

import Image from "next/image";
import Link from "next/link";
import type { User } from "firebase/auth";
import { TripSyncLogo } from "@/components/TripSyncLogo";

function UserPlaceholder() {
  return (
    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-slate-500 ring-2 ring-white">
      <svg
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        aria-hidden
      >
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    </span>
  );
}

export function LandingHeader({ user }: { user: User | null }) {
  const dest = user ? "/dashboard" : "/login";
  const label = user ? "Go to dashboard" : "Sign in";

  return (
    <header className="flex items-center justify-between pb-6 pt-1">
      <TripSyncLogo />
      <Link
        href={dest}
        className="shrink-0 rounded-full outline-none ring-emerald-800/30 focus-visible:ring-2"
        aria-label={label}
      >
        {user?.photoURL ? (
          <Image
            src={user.photoURL}
            alt=""
            width={40}
            height={40}
            className="h-10 w-10 rounded-full object-cover ring-2 ring-white"
          />
        ) : (
          <UserPlaceholder />
        )}
      </Link>
    </header>
  );
}
