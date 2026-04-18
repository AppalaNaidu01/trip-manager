# Developer onboarding

## Prerequisites

- Node.js compatible with the version in `package.json`
- Firebase project with Authentication (Google), Firestore, and (for media) Google Drive API enabled on the same GCP project
- Environment variables — copy `.env.local.example` to `.env.local` and fill values (see [build-plan.md](./build-plan.md))

## Commands

```bash
npm install
npm run dev      # local development
npm run build    # production build (run before merging)
```

## Repository shape

- **`src/app/`** — Next.js App Router routes. `(app)` group uses the shared layout with `Protected`, `TripChromeProvider`, `AppShell`.
- **`src/components/trip/`** — Trip detail panels (overview images, expenses, photos, route, checklist, members) and `TripDetail.tsx`.
- **`src/contexts/`** — `AuthContext`, `TripChromeContext` (trip header title, subtitle, invite URL, camera/invite actions).
- **`src/lib/`** — Firebase client (`getDb`), Firestore mappers (`firestore-map.ts`), trip utilities (`trip-utils.ts`), route segment helpers (`route-segments.ts`), Google Drive helpers.
- **`src/hooks/`** — e.g. `useTripRoute.ts` (live subscription to `trips/{id}/route/summary`).

## Authentication flow

- Unauthenticated users hitting protected routes see `Protected` (`src/components/Protected.tsx`) and are redirected toward `/login`.
- After Google sign-in, users land on `/dashboard` or return to the app shell.

## App shell variants (`AppShell.tsx`)

Pathname drives layout:

- **`/dashboard`** — Hamburger, centered **TripSync** title (uppercase tracking), profile menu, cream background `#F9F9F7`.
- **`/trips/new`** — Close (X) to dashboard, same **TripSync** title styling, three-column grid to mirror dashboard alignment; cream background.
- **`/trips/[tripId]`** (not `/trips/new`) — `TripOverviewBar`: back link, dynamic title from `TripChromeContext`, optional camera / invite / overflow menu.
- **Other** (e.g. `/login`, `/privacy`) — Simplified header; see each page.

## Trip chrome (`TripChromeContext`)

`TripDetail` calls `setChrome({ title, subtitle, headerRight, inviteUrl, onCamera, onInvitePeople })` based on active tab. The shell reads this for the trip header. **`inviteUrl`** must be set for **Share invite** in the overflow menu (join URL, not the trip page URL).

## Firestore access patterns

- Trips list: query `trips` where `memberIds` array-contains current uid.
- Trip subcollections: `members`, `expenses`, `media`, `timelineEvents`, `route` (document id `summary`), optional `checklistReminders` / `memberReminders` for broadcast UX.

## Google Drive and images

Trip photos and cover images use the Drive pipeline documented in [media-google-drive.md](./media-google-drive.md). First upload creates a Drive folder and stores `driveFolderId` on the trip document.

## Testing expectations

There is no mandatory test suite in this repo for every change; **`npm run build`** should pass TypeScript and Next.js compilation before merge.

## Related reading

- [feature-inventory.md](./feature-inventory.md) — behavior-level map of major UI features.
- [firestore-schema-notes.md](./firestore-schema-notes.md) — fields not fully spelled out in the original PRD.
