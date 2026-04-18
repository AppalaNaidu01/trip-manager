"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useDashboardSearch } from "@/contexts/DashboardSearchContext";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

function LogOutIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { logOut } = useAuth();
  const pathname = usePathname();
  const { query, setQuery } = useDashboardSearch();
  const isDashboard = pathname === "/dashboard";

  return (
    <div className="flex min-h-dvh w-full flex-1 flex-col bg-white text-[#0f172a]">
      <header className="sticky top-0 z-30 bg-emerald-800 text-white shadow-md shadow-emerald-950/15">
        <div className="mx-auto w-full max-w-lg px-4 pt-4">
          <div className="flex items-center justify-between gap-3">
            <Link
              href="/dashboard"
              className="text-lg font-bold tracking-tight text-white"
            >
              TripSync
            </Link>
            <button
              type="button"
              onClick={() => logOut()}
              className="flex h-10 w-10 items-center justify-center rounded-full text-white transition hover:bg-white/15"
              aria-label="Sign out"
            >
              <LogOutIcon className="h-6 w-6" />
            </button>
          </div>
          {isDashboard ? (
            <div className="mt-3 pb-4">
              <label className="sr-only" htmlFor="trip-search">
                Search trips
              </label>
              <input
                id="trip-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search trips..."
                className="w-full rounded-full border-0 bg-white/20 px-4 py-2.5 text-sm text-white placeholder:text-white/65 outline-none ring-1 ring-white/25 transition focus:bg-white/25 focus:ring-2 focus:ring-white/40"
              />
            </div>
          ) : (
            <div className="pb-4" />
          )}
        </div>
      </header>

      <div
        className={`mx-auto w-full max-w-lg flex-1 px-4 ${isDashboard ? "pb-28 pt-2" : "py-6"}`}
      >
        {children}
      </div>

      {isDashboard ? (
        <Link
          href="/trips/new"
          className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-800 text-white shadow-lg shadow-emerald-800/45 transition hover:brightness-110 active:scale-95"
          aria-label="New trip"
        >
          <svg
            className="h-7 w-7"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            aria-hidden
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
        </Link>
      ) : null}
    </div>
  );
}
