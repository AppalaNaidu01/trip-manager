"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useTripChrome } from "@/contexts/TripChromeContext";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

function ArrowLeftIcon({ className }: { className?: string }) {
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
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function ShareIcon({ className }: { className?: string }) {
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
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}

function MoreVerticalIcon({ className }: { className?: string }) {
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
      <circle cx="12" cy="6" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="18" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function CameraIcon({ className }: { className?: string }) {
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
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  );
}

function UserPlusIcon({ className }: { className?: string }) {
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
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 11v6M19 14h6" />
    </svg>
  );
}

function TripOverviewBar() {
  const { chrome } = useTripChrome();
  const [hint, setHint] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const showCamera = chrome?.headerRight === "camera";
  const showInvitePeople = chrome?.headerRight === "invitePeople";
  async function share() {
    const invite = chrome?.inviteUrl?.trim();
    const fallback =
      typeof window !== "undefined" ? window.location.href : "";
    const url =
      invite && invite.length > 0 ? invite : fallback;
    if (!url) return;
    try {
      if (navigator.share) {
        await navigator.share({ title: chrome?.title ?? "Trip", url });
      } else {
        await navigator.clipboard.writeText(url);
        setHint(true);
        setTimeout(() => setHint(false), 2000);
      }
    } catch {
      try {
        await navigator.clipboard.writeText(url);
        setHint(true);
        setTimeout(() => setHint(false), 2000);
      } catch {
        /* ignore */
      }
    }
    setMenuOpen(false);
  }
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/90 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto grid w-full max-w-lg grid-cols-[auto_1fr_auto] items-center gap-2 px-4 py-3">
        <Link
          href="/dashboard"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-800 transition hover:bg-slate-100"
          aria-label="Back to trips"
        >
          <ArrowLeftIcon className="h-6 w-6" />
        </Link>
        <div className="min-w-0 text-center">
          <h1 className="truncate text-base font-semibold tracking-tight text-[#14532d]">
            {chrome?.title ?? "Trip"}
          </h1>
          {chrome?.subtitle && chrome.subtitle.length > 0 ? (
            <p className="truncate text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500">
              {chrome.subtitle}
            </p>
          ) : null}
        </div>
        <div className="relative flex shrink-0 justify-end">
          {showInvitePeople ? (
            <button
              type="button"
              onClick={() => chrome?.onInvitePeople?.()}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-[#14532d] transition hover:bg-emerald-50"
              aria-label="Copy invite link"
            >
              <UserPlusIcon className="h-6 w-6" />
            </button>
          ) : showCamera ? (
            <button
              type="button"
              onClick={() => chrome?.onCamera?.()}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-[#14532d] transition hover:bg-emerald-50"
              aria-label="Upload photo"
            >
              <CameraIcon className="h-6 w-6" />
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-800 transition hover:bg-slate-100"
                aria-label="Trip menu"
                aria-expanded={menuOpen}
              >
                <MoreVerticalIcon className="h-5 w-5" />
              </button>
              {menuOpen ? (
                <>
                  <button
                    type="button"
                    className="fixed inset-0 z-40 cursor-default"
                    aria-label="Close menu"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full z-50 mt-1 min-w-[10rem] rounded-xl border border-slate-200 bg-white py-1 shadow-lg shadow-slate-900/10 ring-1 ring-black/5">
                    <button
                      type="button"
                      onClick={() => void share()}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-medium text-slate-800 hover:bg-slate-50"
                    >
                      <ShareIcon className="h-4 w-4 shrink-0 opacity-70" />
                      {hint ? "Invite link copied" : "Share invite"}
                    </button>
                  </div>
                </>
              ) : null}
            </>
          )}
        </div>
      </div>
    </header>
  );
}

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
  const isNewTripPage = pathname === "/trips/new";
  const isTripDetailPage =
    /^\/trips\/[^/]+$/.test(pathname) && pathname !== "/trips/new";
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

  if (isNewTripPage) {
    return (
      <div className="flex min-h-dvh w-full flex-1 flex-col bg-[#F9F9F7] text-[#0f172a]">
        <header className="sticky top-0 z-30 border-b border-slate-200/90 bg-white/95 backdrop-blur-sm">
          <div className="mx-auto grid w-full max-w-lg grid-cols-3 items-center gap-2 px-4 py-3">
            <Link
              href="/dashboard"
              className="flex h-10 w-10 items-center justify-center rounded-xl text-[#14532d] transition hover:bg-emerald-50"
              aria-label="Back to trips"
            >
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                aria-hidden
              >
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </Link>
            <div className="text-center">
              <span className="text-sm font-semibold uppercase tracking-[0.16em] text-[#14532d]">
                TripSync
              </span>
            </div>
            <div className="flex justify-end" aria-hidden>
              <span className="h-10 w-10" />
            </div>
          </div>
        </header>
        <div className="mx-auto w-full min-w-0 max-w-lg flex-1 px-4 pb-12 pt-4">
          {children}
        </div>
      </div>
    );
  }

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
              <span className="text-sm font-semibold uppercase tracking-[0.16em] text-[#14532d]">
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
                <p className="text-sm font-semibold text-emerald-900">
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

        <div className="mx-auto w-full min-w-0 max-w-lg flex-1 px-4 pb-10 pt-4">
          {children}
        </div>
      </div>
    );
  }

  if (isTripDetailPage) {
    return (
      <div className="flex min-h-dvh w-full flex-1 flex-col bg-[#F9F9F7] text-[#0f172a]">
        <TripOverviewBar />
        <div className="mx-auto w-full min-w-0 max-w-lg flex-1 px-4 pb-12 pt-2">
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

      <div className="mx-auto w-full min-w-0 max-w-lg flex-1 px-4 py-6">
        {children}
      </div>
    </div>
  );
}
