# Trip media and Google Drive

TripSync stores trip photos, cover, and background images in **the signed-in user’s Google Drive** instead of Firebase Storage. Firebase is still used for **metadata** (Firestore) and **authentication** (Firebase Auth + Google).

## Prerequisites

1. In [Google Cloud Console](https://console.cloud.google.com/), open the project linked to your Firebase app (same project ID as `NEXT_PUBLIC_FIREBASE_PROJECT_ID`).
2. Enable **Google Drive API**: APIs & Services → Library → “Google Drive API” → Enable.
3. The OAuth consent screen must include the **Drive** scope the app requests (`drive.file`). For internal testing, “Testing” mode is enough; production may require verification if scopes are sensitive (`drive.file` is typically non-sensitive).

## User flow

1. User signs in with Google. On **desktop**, Firebase uses a **popup**; on **phones/tablets** (and if the browser blocks popups), the app uses a **full-page redirect** to Google instead — the app completes sign-in with `getRedirectResult` on load and caches the Drive access token the same way.
2. On the first upload for a trip, the app requests the `drive.file` scope via **popup or redirect** (same rules as above).
3. The app **creates a folder** in the user’s My Drive named like `TripName_tripIdSuffix`.
4. The folder is shared:
   - **Anyone** with the link can **read** (public gallery-style access for thumbnails).
   - Each trip **member’s Google email** (from Firestore `members`) is granted **writer** so they can upload to the same folder when they use the app.
5. Each image is uploaded into that folder via the **Drive multipart upload** API.
6. Firestore stores:
   - On `trips/{tripId}`: `driveFolderId`, `driveFolderWebViewLink`, and optional `coverDriveFileId` / `backgroundDriveFileId`.
   - On `trips/{tripId}/media/{mediaId}`: `url` (thumbnail URL), `driveFileId`, `uploadedBy`, `createdAt`.

## Display URLs

After each upload, the app sets **link sharing** on the **file** (not only the folder) so images can load without Google cookies.

Stored `url` prefers the API’s **`thumbnailLink`** (`lh3.googleusercontent.com`), which works reliably in `<img src>`. The UI **prefers that stored URL** when present.

If the thumbnail is not ready yet (or only `driveFileId` is known), the app loads images via a **same-origin proxy**: `GET /api/drive-image?fileId=…` fetches bytes from Drive on the server and returns `image/*` to the browser. Direct `drive.google.com/uc?export=view` URLs are **not** used as `<img src>` — they often return HTML instead of image data.

Legacy rows that only have a Firebase Storage `url` and no `driveFileId` still work until re-uploaded.

## Tokens

The Google **access token** is obtained from the Firebase sign-in result (`GoogleAuthProvider.credentialFromResult`) after either **popup** or **redirect**, and cached in memory/sessionStorage for ~55 minutes. `AuthContext` calls `getRedirectResult` on startup so returning mobile users get the token without a second step. On `401` from the Drive API, the cache is cleared and the user is prompted again.

## Troubleshooting

- **403 / API not enabled**: Enable Google Drive API for the GCP project.
- **Upload fails with opaque error**: Check browser network tab for Drive API response; verify consent includes Drive scope.
- **Member cannot upload**: Writer grants require a valid **Gmail / Google account email** on the member document; missing email cannot receive Drive sharing.
