"use client";

import { useAuth } from "@/contexts/AuthContext";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden
    >
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="18" x2="20" y2="18" />
    </svg>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { user, logOut } = useAuth();
  const pathname = usePathname();
  const isDashboard = pathname === "/dashboard";
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (
        profileWrapRef.current &&
        !profileWrapRef.current.contains(e.target as Node)
      ) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  useEffect(() => {
    setMenuOpen(false);
    setProfileOpen(false);
  }, [pathname]);

  if (isDashboard) {
    return (
      <div className="flex min-h-dvh w-full flex-1 flex-col bg-[#F9F9F7] text-[#0f172a]">
        <header className="sticky top-0 z-30 border-b border-slate-200/90 bg-white/95 backdrop-blur-sm">
          <div className="mx-auto grid w-full max-w-lg grid-cols-3 items-center gap-2 px-4 py-3">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-800 transition hover:bg-slate-100"
              aria-label="Open menu"
            >
              <MenuIcon className="h-6 w-6" />
            </button>
            <div className="text-center">
              <span className="font-serif text-sm font-medium uppercase tracking-[0.16em] text-[#1B3B2B]">
                TripSync
              </span>
            </div>
            <div className="relative flex justify-end" ref={profileWrapRef}>
              <button
                type="button"
                onClick={() => setProfileOpen((o) => !o)}
                className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-200 ring-2 ring-white transition hover:ring-emerald-200"
                aria-label="Account menu"
                aria-expanded={profileOpen}
              >
                {user?.photoURL ? (
                  <Image
                    src={user.photoURL}
                    alt=""
                    width={40}
                    height={40}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-semibold text-slate-600">
                    {(user?.email ?? "?").slice(0, 1).toUpperCase()}
                  </span>
                )}
              </button>
              {profileOpen ? (
                <div className="absolute right-0 top-full z-50 mt-2 min-w-[10rem] rounded-xl border border-slate-200 bg-white py-1 shadow-lg shadow-slate-900/10 ring-1 ring-black/5">
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      void logOut();
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm font-medium text-slate-800 transition hover:bg-slate-50"
                  >
                    Log out
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        {menuOpen ? (
          <>
            <button
              type="button"
              className="fixed inset-0 z-40 bg-slate-900/40"
              aria-label="Close menu"
              onClick={() => setMenuOpen(false)}
            />
            <aside className="fixed left-0 top-0 z-50 flex h-full w-[min(100%,18rem)] flex-col bg-white shadow-2xl">
              <div className="border-b border-slate-100 px-4 py-4">
                <p className="font-serif text-sm font-semibold text-emerald-900">
                  Menu
                </p>
              </div>
              <nav className="flex flex-col p-2">
                <Link
                  href="/"
                  className="rounded-lg px-3 py-3 text-sm font-medium text-slate-800 hover:bg-slate-50"
                  onClick={() => setMenuOpen(false)}
                >
                  Home
                </Link>
                <Link
                  href="/dashboard"
                  className="rounded-lg px-3 py-3 text-sm font-medium text-slate-800 hover:bg-slate-50"
                  onClick={() => setMenuOpen(false)}
                >
                  My trips
                </Link>
                <Link
                  href="/trips/new"
                  className="rounded-lg px-3 py-3 text-sm font-medium text-slate-800 hover:bg-slate-50"
                  onClick={() => setMenuOpen(false)}
                >
                  Create trip
                </Link>
              </nav>
            </aside>
          </>
        ) : null}

        <div className="mx-auto w-full max-w-lg flex-1 px-4 pb-10 pt-4">
          {children}
        </div>
      </div>
    );
  }

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
            <div className="relative" ref={profileWrapRef}>
              <button
                type="button"
                onClick={() => setProfileOpen((o) => !o)}
                className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-white/20 text-white ring-2 ring-white/30 transition hover:bg-white/25"
                aria-label="Account menu"
                aria-expanded={profileOpen}
              >
                {user?.photoURL ? (
                  <Image
                    src={user.photoURL}
                    alt=""
                    width={40}
                    height={40}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-semibold">
                    {(user?.email ?? "?").slice(0, 1).toUpperCase()}
                  </span>
                )}
              </button>
              {profileOpen ? (
                <div className="absolute right-0 top-full z-50 mt-2 min-w-[10rem] rounded-xl border border-white/20 bg-emerald-900 py-1 shadow-lg">
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      void logOut();
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm font-medium text-white transition hover:bg-white/10"
                  >
                    Log out
                  </button>
                </div>
              ) : null}
            </div>
          </div>
          <div className="pb-4" />
        </div>
      </header>

      <div className="mx-auto w-full max-w-lg flex-1 px-4 py-6">{children}</div>
    </div>
  );
}
