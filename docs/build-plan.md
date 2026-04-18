# TripSync MVP — Build plan

This document tracks implementation of the MVP described in [initial-prd.md](./initial-prd.md). Stack: **Next.js (App Router)**, **Firebase Auth (Google)**, **Firestore**, **Firebase Storage**, **Next.js Route Handlers** for server-side join using the Firebase Admin SDK.

## Architecture

- **Trips** live in `trips/{tripId}` with `memberIds` for querying “my trips”.
- **Invite links** use documents in `inviteLookups/{token}` (readable publicly for resolving the trip id and name). The trip’s `inviteToken` matches this id.
- **Join** is performed via `POST /api/join` with a Firebase ID token so the server can update `memberIds` and `members/{uid}` without loosening client Firestore rules.
- **Subcollections** under each trip: `members`, `expenses`, `media`, `timelineEvents`.
- **Timeline** entries for expenses and media use deterministic document ids (`expense_{expenseId}`, `media_{mediaId}`) so deletes stay in sync with batched writes.

## Environment

Copy [.env.local.example](../.env.local.example) to `.env.local` and set:

- `NEXT_PUBLIC_FIREBASE_*` from the Firebase console (Web app).
- `FIREBASE_SERVICE_ACCOUNT_KEY` — full JSON of a service account (one line), for `/api/join`.

Deploy Firestore and Storage rules from the repo root:

```bash
firebase deploy --only firestore:rules,storage
```

## Phase checklist

- [x] **Phase 0 — Foundation:** Next.js app, Firebase client, Google sign-in, protected app shell, baseline `firestore.rules` / `storage.rules`, `.env.local.example`.
- [x] **Phase 1 — Trips:** Create trip (name, date, description), invite token + lookup doc, dashboard list and trip detail shell.
- [x] **Phase 2 — Members:** `/join/[token]` page, `POST /api/join`, members list and roles (admin on creator).
- [x] **Phase 3 — Expenses:** Equal split, list, totals, per-member balances.
- [x] **Phase 4 — Media:** Storage uploads under `trips/{tripId}/…`, gallery, metadata in Firestore.
- [x] **Phase 5 — Timeline:** Batched writes for expense/media/member events; chronological feed on the trip page.
- [x] **Phase 6 — Polish:** Closed trip flag (admin), lazy-loaded images, loading/error states, mobile-friendly layout.

## Current focus

All MVP phases above are implemented in code. Remaining work is **project configuration**: create the Firebase project, enable Google auth, deploy rules, and fill `.env.local`.
