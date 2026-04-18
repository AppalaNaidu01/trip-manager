function HubIcon() {
  return (
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-800 text-white shadow-sm">
      <svg
        className="h-6 w-6"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden
      >
        <line x1="4" y1="9" x2="20" y2="9" />
        <line x1="4" y1="15" x2="20" y2="15" />
      </svg>
    </span>
  );
}

function WalletIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M16 12h.01" />
    </svg>
  );
}

function PhotoIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="m21 15-5-5L5 21" />
    </svg>
  );
}

function MapIcon() {
  return (
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-800 text-white shadow-sm">
      <svg
        className="h-6 w-6"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        aria-hidden
      >
        <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
        <line x1="9" y1="3" x2="9" y2="18" />
        <line x1="15" y1="6" x2="15" y2="21" />
      </svg>
    </span>
  );
}

function NetworkGraphic() {
  return (
    <svg
      className="h-24 w-28 shrink-0 text-emerald-800/10"
      viewBox="0 0 120 100"
      fill="currentColor"
      aria-hidden
    >
      <circle cx="20" cy="50" r="6" />
      <circle cx="60" cy="25" r="6" />
      <circle cx="100" cy="50" r="6" />
      <circle cx="60" cy="75" r="6" />
      <path
        d="M26 50 L54 28 M66 28 L94 50 M26 50 L54 72 M66 72 L94 50 M54 31 L54 69"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export function LandingFeaturesBento() {
  return (
    <section className="mt-14 w-full">
      <h2 className="text-center text-lg font-semibold text-slate-900">
        Everything your group needs
      </h2>

      <div className="mt-8 flex flex-col gap-4">
        <div className="relative overflow-hidden rounded-2xl bg-neutral-100 p-5 ring-1 ring-slate-200/80">
          <div className="flex items-start gap-4">
            <HubIcon />
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-slate-900">Trip hub</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                The central command for all your logistics and chat.
              </p>
            </div>
            <NetworkGraphic />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col rounded-2xl bg-emerald-800 p-4 text-white shadow-sm ring-1 ring-emerald-900/20">
            <WalletIcon className="h-7 w-7 opacity-95" />
            <h3 className="mt-3 font-semibold">Expenses</h3>
            <p className="mt-2 text-xs leading-relaxed text-emerald-50/95">
              Split costs fairly without the math headache.
            </p>
          </div>
          <div className="flex flex-col rounded-2xl bg-orange-50 p-4 text-slate-900 ring-1 ring-orange-100/80">
            <PhotoIcon className="h-7 w-7 text-orange-800/90" />
            <h3 className="mt-3 font-semibold">Photos</h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">
              A shared vault for every shot captured.
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl bg-neutral-100 p-5 ring-1 ring-slate-200/80">
          <div className="flex items-start gap-4">
            <MapIcon />
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-slate-900">Route plan</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Optimized daily routes for the whole squad.
              </p>
            </div>
            <div className="hidden h-20 w-24 shrink-0 overflow-hidden rounded-lg bg-slate-200 shadow-inner sm:block">
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-sky-200/80 via-emerald-100 to-amber-100">
                <svg
                  className="h-10 w-10 text-slate-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.25"
                  aria-hidden
                >
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
