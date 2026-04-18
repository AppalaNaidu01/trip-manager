"use client";

import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  const { user, logOut } = useAuth();
  const pathname = usePathname();

  return (
    <div className="flex min-h-full flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/90 px-4 py-3 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/90">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link
              href="/dashboard"
              className={`text-sm font-semibold ${
                pathname === "/dashboard"
                  ? "text-emerald-700 dark:text-emerald-400"
                  : "text-zinc-900 dark:text-zinc-100"
              }`}
            >
              TripSync
            </Link>
            <Link
              href="/dashboard"
              className={`text-sm ${
                pathname === "/dashboard"
                  ? "text-zinc-900 dark:text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
              }`}
            >
              Trips
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden max-w-[12rem] truncate text-xs text-zinc-500 sm:inline">
              {user?.email}
            </span>
            <button
              type="button"
              onClick={() => logOut()}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 py-6">
        {children}
      </div>
    </div>
  );
}
