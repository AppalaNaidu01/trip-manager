"use client";

import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

function GoogleMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function AppIcon() {
  return (
    <div
      className="mx-auto flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-[1.35rem] bg-gradient-to-br from-emerald-600 via-emerald-800 to-teal-900 shadow-lg shadow-emerald-800/35"
      aria-hidden
    >
      <svg
        className="h-10 w-10 text-white"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.65"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M22 2 11 13" />
        <path d="M22 2 15 22 11 13 2 9 22 2Z" />
      </svg>
    </div>
  );
}

const decorativeIcons = [
  {
    emoji: "🏖️",
    gradient: "from-teal-400 to-sky-500",
  },
  {
    emoji: "✈️",
    gradient: "from-lime-400 to-amber-300",
  },
  {
    emoji: "🎉",
    gradient: "from-emerald-500 to-amber-400",
  },
] as const;

export default function LoginPage() {
  const { user, loading, configError, signInWithGoogle } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [user, loading, router]);

  if (configError) {
    return (
      <div className="flex min-h-dvh w-full flex-col items-center justify-center bg-white px-4 py-8 text-center text-slate-900">
        <p className="font-semibold text-slate-900">Firebase is not configured</p>
        <p className="mt-2 max-w-md text-sm text-slate-600">
          Copy{" "}
          <code className="rounded-md bg-slate-200/80 px-1.5 py-0.5 text-xs">
            .env.local.example
          </code>{" "}
          to{" "}
          <code className="rounded-md bg-slate-200/80 px-1.5 py-0.5 text-xs">
            .env.local
          </code>{" "}
          and add your Firebase keys.
        </p>
        <Link
          href="/"
          className="mt-6 text-sm font-medium text-slate-600 underline underline-offset-2 hover:text-slate-900"
        >
          Back to home
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh w-full flex-col items-center justify-center bg-white px-4 py-10 text-slate-900">
      <div className="flex w-full max-w-[min(100%,380px)] flex-col items-stretch">
        <div className="text-center">
          <AppIcon />
          <h1 className="mt-5 text-2xl font-bold tracking-tight text-[#0f172a]">
            TripSync
          </h1>
          <p className="mt-1.5 text-sm font-medium text-slate-500">
            All your trips. One place.
          </p>
        </div>

        <div className="mt-8 flex items-center justify-center gap-4">
          {decorativeIcons.map((item, i) => (
            <div
              key={item.emoji}
              className={`login-icon-bob flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br ${item.gradient} text-xl shadow-md`}
              style={{ animationDelay: `${i * 0.25}s` }}
            >
              <span aria-hidden>{item.emoji}</span>
            </div>
          ))}
        </div>

        <div className="mt-10 w-full">
          <button
            type="button"
            disabled={loading}
            onClick={() => signInWithGoogle()}
            className="flex w-full items-center justify-center gap-3 rounded-2xl bg-white py-3.5 pl-4 pr-5 text-[15px] font-semibold text-slate-700 shadow-[0_4px_14px_rgba(15,23,42,0.12)] ring-1 ring-slate-200/80 transition hover:bg-slate-50 hover:shadow-[0_6px_20px_rgba(15,23,42,0.14)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <GoogleMark className="h-5 w-5 shrink-0" />
            {loading ? "Signing in…" : "Continue with Google"}
          </button>
          <p className="mt-4 text-center text-[11px] leading-relaxed text-slate-400">
            By continuing, you agree to TripSync&apos;s{" "}
            <Link
              href="/terms"
              className="text-emerald-800 underline underline-offset-2 hover:text-emerald-900"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              href="/privacy"
              className="text-emerald-800 underline underline-offset-2 hover:text-emerald-900"
            >
              Privacy Policy
            </Link>
            .
          </p>
        </div>

        <Link
          href="/"
          className="mt-10 text-center text-sm font-medium text-slate-400 transition hover:text-slate-600"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
