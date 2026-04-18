# Firestore schema notes (extensions beyond the PRD)

The [initial-prd.md](./initial-prd.md) data model is the baseline. This file lists **additional or clarified fields** the app uses today. Always confirm with `src/types/models.ts` and `src/lib/firestore-map.ts` when editing.

## `trips/{tripId}`

| Field | Type | Notes |
| ----- | ---- | ----- |
| `groupSync` | boolean | Default **true** when missing (see `mapTrip`). Create trip form persists user choice. |
| `routeSegmentId` | — | Not on trip; see **media** below. |
| `coverImageUrl`, `coverDriveFileId` | string / null | Cover image after Drive upload. |
| `driveFolderId`, `driveFolderWebViewLink` | string / null | Set when Drive folder is created. |
| `closed` | boolean | Admin can close trip; members may still view. |
| `inviteToken` | string | Matches `inviteLookups/{token}` document id. |

## `trips/{tripId}/media/{mediaId}`

| Field | Type | Notes |
| ----- | ---- | ----- |
| `routeSegmentId` | string, optional | Checkpoint: `start`, `stop-{n}`, `destination`. Omitted or null → treated as **not tagged** in UI. |
| `url`, `driveFileId` | | Thumbnail / Drive file reference. |
| `uploadedBy`, `createdAt` | | As in PRD. |

## `trips/{tripId}/route/summary`

Single document (id **`summary`**) for manual route: start, destination, stops array, metrics text fields, notes. Mapped by `mapTripRoute` in `firestore-map.ts`.

## `inviteLookups/{token}`

| Field | Purpose |
| ----- | ------- |
| `tripId`, `tripName` | Resolve invite landing and join flow. |

## Deterministic timeline ids

- `timelineEvents/media_{mediaId}`
- `timelineEvents/expense_{expenseId}`

Keeps timeline in sync with batched deletes.

## Indexing

If you add new collection group queries or compound filters, add the required composite indexes in `firestore.indexes.json` (if present) or the Firebase console.
