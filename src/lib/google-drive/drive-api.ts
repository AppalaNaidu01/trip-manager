"use client";

import { clearDriveTokenCache, getGoogleDriveAccessToken } from "./token";

const DRIVE_BASE = "https://www.googleapis.com/drive/v3";
const UPLOAD_BASE = "https://www.googleapis.com/upload/drive/v3";

async function driveFetch(
  path: string,
  init: RequestInit & { accessToken: string },
): Promise<Response> {
  const { accessToken, ...rest } = init;
  let token = accessToken;
  let res = await fetch(path, {
    ...rest,
    headers: {
      ...rest.headers,
      Authorization: `Bearer ${token}`,
    },
  });

  if (res.status === 401) {
    clearDriveTokenCache();
    token = await getGoogleDriveAccessToken(true);
    res = await fetch(path, {
      ...rest,
      headers: {
        ...rest.headers,
        Authorization: `Bearer ${token}`,
      },
    });
  }

  return res;
}

export type CreatedFolder = {
  id: string;
  webViewLink?: string;
};

export async function createTripFolder(
  accessToken: string,
  displayName: string,
): Promise<CreatedFolder> {
  const res = await driveFetch(`${DRIVE_BASE}/files?fields=id,webViewLink`, {
    method: "POST",
    accessToken,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: displayName,
      mimeType: "application/vnd.google-apps.folder",
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(
      `Drive: could not create folder (${res.status}). ${err.slice(0, 200)}`,
    );
  }
  const data = (await res.json()) as { id: string; webViewLink?: string };
  return { id: data.id, webViewLink: data.webViewLink };
}

export async function setAnyoneReader(
  accessToken: string,
  fileId: string,
): Promise<void> {
  const res = await driveFetch(
    `${DRIVE_BASE}/files/${encodeURIComponent(fileId)}/permissions`,
    {
      method: "POST",
      accessToken,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "anyone",
        role: "reader",
        allowFileDiscovery: false,
      }),
    },
  );
  if (!res.ok && res.status !== 409) {
    const err = await res.text();
    throw new Error(
      `Drive: could not share folder (${res.status}). ${err.slice(0, 200)}`,
    );
  }
}

export async function addWriterByEmail(
  accessToken: string,
  fileId: string,
  email: string,
): Promise<void> {
  const res = await driveFetch(
    `${DRIVE_BASE}/files/${encodeURIComponent(fileId)}/permissions`,
    {
      method: "POST",
      accessToken,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "user",
        role: "writer",
        emailAddress: email.trim().toLowerCase(),
      }),
    },
  );
  if (!res.ok && res.status !== 409) {
    const err = await res.text();
    console.warn(
      `Drive: could not add writer ${email} (${res.status}):`,
      err.slice(0, 150),
    );
  }
}

export type UploadedFile = {
  id: string;
  webViewLink?: string;
  thumbnailLink?: string;
};

export async function uploadImageToFolder(
  accessToken: string,
  parentFolderId: string,
  file: File,
  nameHint: string,
): Promise<UploadedFile> {
  const boundary = `trip_boundary_${Date.now()}`;
  const safeName =
    nameHint.replace(/[^\w.\- ]+/g, "_").slice(0, 120) ||
    `upload_${Date.now()}.jpg`;

  const metadata = {
    name: safeName,
    parents: [parentFolderId],
  };

  const metaPart = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`;
  const filePart = `--${boundary}\r\nContent-Type: ${file.type || "application/octet-stream"}\r\n\r\n`;
  const end = `\r\n--${boundary}--`;

  const fileBuf = await file.arrayBuffer();
  const blob = new Blob([metaPart, filePart, fileBuf, end], {
    type: `multipart/related; boundary=${boundary}`,
  });

  const res = await driveFetch(
    `${UPLOAD_BASE}/files?uploadType=multipart&fields=id,webViewLink,thumbnailLink`,
    {
      method: "POST",
      accessToken,
      headers: {
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body: blob,
    },
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(
      `Drive: upload failed (${res.status}). ${err.slice(0, 200)}`,
    );
  }

  const created = (await res.json()) as UploadedFile;
  /** Folder sharing does not always make new files web-visible; grant link access on the file. */
  await setAnyoneReader(accessToken, created.id);
  return created;
}

export async function deleteDriveFile(
  accessToken: string,
  fileId: string,
): Promise<void> {
  const res = await driveFetch(
    `${DRIVE_BASE}/files/${encodeURIComponent(fileId)}`,
    {
      method: "DELETE",
      accessToken,
    },
  );
  if (!res.ok && res.status !== 404) {
    const err = await res.text();
    throw new Error(
      `Drive: delete failed (${res.status}). ${err.slice(0, 200)}`,
    );
  }
}

/**
 * Resolves a URL that works in `<img src>` for a publicly link-shared file.
 * Prefers lh3 thumbnail from the API over drive.google.com/thumbnail (often 403 when embedded).
 */
async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

export async function fetchPublicImageUrl(
  accessToken: string,
  fileId: string,
): Promise<string> {
  /** Thumbnails can appear shortly after upload; retry before falling back to uc URLs. */
  for (let attempt = 0; attempt < 6; attempt++) {
    if (attempt > 0) await sleep(350 * attempt);
    const res = await driveFetch(
      `${DRIVE_BASE}/files/${encodeURIComponent(fileId)}?fields=thumbnailLink,mimeType`,
      { method: "GET", accessToken },
    );
    if (!res.ok) {
      const err = await res.text();
      throw new Error(
        `Drive: could not read file metadata (${res.status}). ${err.slice(0, 200)}`,
      );
    }
    const data = (await res.json()) as {
      thumbnailLink?: string;
    };
    if (data.thumbnailLink) {
      return data.thumbnailLink;
    }
  }
  return driveImageViewUrl(fileId);
}

export function driveImageViewUrl(fileId: string): string {
  return `https://drive.google.com/uc?export=view&id=${encodeURIComponent(fileId)}`;
}

/**
 * URLs that work in `<img src>` (lh3 from Drive API, Firebase Storage).
 * Direct `drive.google.com/uc?export=view` often returns HTML (interstitial), not image bytes.
 */
export function isReliableDriveDisplayUrl(url: string): boolean {
  try {
    const u = new URL(url);
    if (u.protocol !== "https:") return false;
    if (u.hostname.endsWith(".googleusercontent.com")) return true;
    if (u.hostname.includes("firebasestorage.googleapis.com")) return true;
    if (u.hostname === "drive.google.com") return false;
    return true;
  } catch {
    return false;
  }
}

/** Same-origin proxy — use when direct Drive URLs break in the browser. */
export function driveImageProxyUrl(fileId: string): string {
  return `/api/drive-image?fileId=${encodeURIComponent(fileId)}`;
}

/**
 * Prefer stored thumbnailLink (lh3) when present. If we only have `driveFileId`, use the
 * proxy so the browser loads image bytes instead of Drive HTML pages.
 */
export function tripImageSrcForUi(
  driveFileId: string | null | undefined,
  storedUrl: string | null | undefined,
): string | undefined {
  const stored = storedUrl?.trim();
  if (stored && isReliableDriveDisplayUrl(stored)) {
    return stored;
  }
  if (driveFileId) {
    return driveImageProxyUrl(driveFileId);
  }
  return stored || undefined;
}


/** @deprecated Prefer fetchPublicImageUrl after upload */
export function driveImageDisplayUrl(fileId: string): string {
  return driveImageViewUrl(fileId);
}
