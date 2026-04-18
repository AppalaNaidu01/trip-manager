# TripSync — documentation index

Start here. These files are written for **future maintainers** joining the project.

| Document | Purpose |
| -------- | ------- |
| [initial-prd.md](./initial-prd.md) | Original product requirements and MVP scope (source of intent). |
| [build-plan.md](./build-plan.md) | Stack, Firestore/Drive architecture, phase checklist, env setup. |
| [developer-onboarding.md](./developer-onboarding.md) | How to run the app, repo layout, contexts, and “where is X?” map. |
| [feature-inventory.md](./feature-inventory.md) | Implemented features beyond the baseline PRD (photos↔route, search, create trip, etc.). |
| [ui-conventions.md](./ui-conventions.md) | Brand colors, headers, shared layout patterns, aspect ratios. |
| [firestore-schema-notes.md](./firestore-schema-notes.md) | Trip and related documents — fields added after the PRD, naming, segment IDs. |
| [media-google-drive.md](./media-google-drive.md) | Google Drive OAuth, folder creation, uploads, troubleshooting. |
| [ui-login.md](./ui-login.md) | Login page layout and legal link behavior. |
| [phase-2-prd.md](./phase-2-prd.md) / [phase-2-build-plan.md](./phase-2-build-plan.md) | Phase 2 planning (may overlap current code; verify against code). |

**Code entry points**

- App shell & trip chrome: `src/components/AppShell.tsx`, `src/contexts/TripChromeContext.tsx`
- Trip detail (tabs): `src/components/trip/TripDetail.tsx`
- Dashboard: `src/app/(app)/dashboard/page.tsx`
- Create trip: `src/app/(app)/trips/new/page.tsx`

When the PRD and code disagree, **trust the code** and update these docs in the same change as behavior changes.
