# Feature inventory (implementation reference)

This complements [initial-prd.md](./initial-prd.md). It describes **what the code does today** so the next developer can navigate quickly.

## Dashboard (`/dashboard`)

- Lists trips the user belongs to, split into **current**, **planned**, and **past** using `tripTimelineKind` in `src/lib/trip-utils.ts`.
- **Search** uses **local React state** on the page (not a global context). Filtering matches trip **name**, **description**, **id**, and formatted **date range** string; multiple space-separated terms use **AND** logic.
- **Featured cards** use a **16∶10** cover thumbnail (`aspect-[16/10]`), trip metadata, and a **member stack** showing up to **three initials** from `trips/{tripId}/members` (Firestore), with a `+N` overflow badge. Subscriptions are keyed by sorted trip ids to avoid churn when trip documents update without id changes.

## Create trip (`/trips/new`)

- Dedicated shell in `AppShell.tsx`: close to dashboard, **TripSync** title matches dashboard typography (uppercase, letter-spacing).
- Form: hero copy, optional **cover image** (staged file; after trip creation, upload via same Drive path as overview cover), **start/end** dates, **description**, **Group Sync** toggle.
- **`groupSync`** is persisted on the trip document (`true` by default; `false` when toggled off). Intended for future rules around collaborative route editing; not all flows may enforce it yet.
- Legal footer on this page was removed; login links only to **Privacy** (`/privacy`). There is **no `/terms` route**.

## Trip detail (`/trips/[tripId]`)

- **Hero** uses **`aspect-[16/10]`** for the cover area (aligned with dashboard cards and overview cover editor).
- Tabs: overview, expenses, photos, route, checklist, members (see `TripTabNav`).
- **Share invite** (overflow menu on trip header): uses **`inviteUrl`** from trip chrome (`/join/{token}`), not the current page URL.

## Photos and routes

- **`MediaItem.routeSegmentId`** (optional on `trips/{tripId}/media/{mediaId}`): logical checkpoint id — `start`, `stop-0`, `stop-1`, …, `destination`. Missing or empty values group as **legacy / not tagged** (`__legacy` bucket in UI).
- **Upload** on Photos tab: dropdown chooses checkpoint; Firestore write includes `routeSegmentId` except for the generic “whole trip” option.
- **Photos tab**: grouped sections per checkpoint; **filter chips** (All + segments). **Lightbox** on image tap: prev/next, keyboard arrows, Escape.
- **Route tab**: journey map (decorative), legend under map for start / stops / destination, **Open Photos (n)** per segment switches to Photos tab with that filter.

Helpers live in `src/lib/route-segments.ts`; `src/hooks/useTripRoute.ts` subscribes to the route document for labels and grouping.

**Caveat:** segment ids for stops are **index-based** (`stop-0`, …). Reordering stops in the route can change which stop index a photo is associated with.

## Overview / trip look

- Cover upload on overview (`TripImagesPanel`) uses Drive; **16∶10** preview area.

## Layout and polish

- Trip detail and shells use **cream** `#F9F9F7` and **forest green** `#14532d` for primary actions and brand text (see [ui-conventions.md](./ui-conventions.md)).
- `TripDetail` root layout has been tuned to reduce horizontal clipping (`min-w-0`, overflow behavior) on small viewports.

## Removed or omitted

- **`/terms`**: route and placeholder page removed. Do not re-add without product decision.
- **Dashboard search context**: removed in favor of local state on the dashboard page.
