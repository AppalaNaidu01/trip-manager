"use client";

import Image from "next/image";

const HERO_IMG =
  "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=900&q=80";

export function LandingHero({ onExploreTrips }: { onExploreTrips: () => void }) {
  return (
    <section className="w-full">
      <div className="flex flex-col items-center text-center">
        <p className="rounded-full bg-emerald-100 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-800">
          Adventure awaits
        </p>
        <h1 className="mt-5 text-[1.75rem] font-bold leading-tight tracking-tight text-slate-900 sm:text-3xl">
          Group Trips,
          <br />
          <span className="text-emerald-800">Simplified.</span>
        </h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-slate-600">
          Stop the endless group chats. One place for your itinerary, splitting
          bills, and sharing memories with the people who matter most.
        </p>
        <button
          type="button"
          onClick={onExploreTrips}
          className="mt-8 w-full max-w-sm rounded-3xl bg-emerald-800 py-4 text-[15px] font-semibold text-white shadow-lg shadow-emerald-800/35 transition hover:brightness-110 active:scale-[0.99]"
        >
          Explore your trips
        </button>
      </div>

      <div className="relative mx-auto mt-10 w-full max-w-md">
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-tl-3xl bg-slate-200">
          <Image
            src={HERO_IMG}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 512px) 100vw, 448px"
            priority
          />
        </div>
        <div className="absolute -bottom-2 right-2 z-10 max-w-[min(100%,14rem)] rounded-2xl border border-slate-100 bg-white p-3 shadow-lg shadow-slate-900/10 ring-1 ring-black/5 sm:right-4 sm:max-w-[15rem]">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-200 to-orange-300 text-xs font-bold text-amber-900 ring-2 ring-white">
                A
              </span>
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-sky-200 to-indigo-300 text-xs font-bold text-indigo-900 ring-2 ring-white">
                B
              </span>
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-emerald-200 to-teal-400 text-xs font-bold text-emerald-900 ring-2 ring-white">
                C
              </span>
            </div>
          </div>
          <p className="mt-2 text-left text-xs font-medium leading-snug text-slate-700">
            6 friends planning{" "}
            <span className="font-semibold text-slate-900">
              &apos;Karachi Room &apos;24&apos;
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}
