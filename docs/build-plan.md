# TripSync MVP — Build plan

This document tracks implementation of the MVP described in [initial-prd.md](./initial-prd.md). Stack: **Next.js (App Router)**, **Firebase Auth (Google)**, **Firestore**, **Google Drive** (trip images via `drive.file` OAuth scope), **Next.js Route Handlers** for server-side join using the Firebase Admin SDK. Firebase Storage is no longer used for new trip media (legacy URLs may still exist).

## Architecture

- **Trips** live in `trips/{tripId}` with `memberIds` for querying “my trips”.
- **Invite links** use documents in `inviteLookups/{token}` (readable publicly for resolving the trip id and name). The trip’s `inviteToken` matches this id.
- **Join** is performed via `POST /api/join` with a Firebase ID token so the server can update `memberIds` and `members/{uid}` without loosening client Firestore rules.
- **Subcollections** under each trip: `members`, `expenses`, `media`, `timelineEvents`.
- **Timeline** entries for expenses and media use deterministic document ids (`expense_{expenseId}`, `media_{mediaId}`) so deletes stay in sync with batched writes.
- **Media (Google Drive):** On first upload per trip, the app creates a **Drive folder** (named from the trip), sets **anyone** read access, grants **writers** to member emails, and stores `driveFolderId` on the trip. Each file is uploaded with the Drive API; Firestore stores `driveFileId` + thumbnail `url`. See **[media-google-drive.md](./media-google-drive.md)**.

## Environment

Copy `.env.local.example` to `.env.local` and set:

- `NEXT_PUBLIC_FIREBASE_*` from the Firebase console (Web app).
- `FIREBASE_SERVICE_ACCOUNT_KEY` — full JSON of a service account (one line), for `/api/join`.

Also enable **Google Drive API** on the same GCP project as Firebase (see [media-google-drive.md](./media-google-drive.md)).

Deploy Firestore and Storage rules from the repo root:

```bash
firebase deploy --only firestore:rules,storage
```

## Phase checklist

- [x] **Phase 0 — Foundation:** Next.js app, Firebase client, Google sign-in, protected app shell, baseline `firestore.rules` / `storage.rules`, `.env.local.example`.
- [x] **Phase 1 — Trips:** Create trip (name, date, description), invite token + lookup doc, dashboard list and trip detail shell.
- [x] **Phase 2 — Members:** `/join/[token]` page, `POST /api/join`, members list and roles (admin on creator).
- [x] **Phase 3 — Expenses:** Equal split, list, totals, per-member balances.
- [x] **Phase 4 — Media:** Google Drive uploads (trip folder, thumbnails in Firestore). Legacy Firebase Storage URLs may still appear on old documents.
- [x] **Phase 5 — Timeline:** Batched writes for expense/media/member events; chronological feed on the trip page.
- [x] **Phase 6 — Polish:** Closed trip flag (admin), lazy-loaded images, loading/error states, mobile-friendly layout.

## Current focus

Remaining work is **project configuration**: Firebase project, Google auth, **Drive API enabled**, deploy rules, and fill `.env.local`.

### Documentation

- **[ui-login.md](./ui-login.md)** — Sign-in page layout, branding, legal links, and related routes (`/terms`, `/privacy` placeholders).
- **[media-google-drive.md](./media-google-drive.md)** — Drive OAuth, folder creation, Firestore fields, troubleshooting.
