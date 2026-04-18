import { NextResponse } from "next/server";

const FILE_ID_RE = /^[a-zA-Z0-9_-]+$/;

function isJpegOrPngMagic(buf: ArrayBuffer): boolean {
  const u = new Uint8Array(buf.slice(0, 12));
  if (u.length >= 3 && u[0] === 0xff && u[1] === 0xd8 && u[2] === 0xff) return true;
  if (
    u.length >= 8 &&
    u[0] === 0x89 &&
    u[1] === 0x50 &&
    u[2] === 0x4e &&
    u[3] === 0x47
  )
    return true;
  return false;
}

/** Use Google Cloud API key (same project as Firebase) to read public file metadata. */
async function fetchThumbnailLinkViaApi(fileId: string): Promise<string | null> {
  const key =
    process.env.GOOGLE_DRIVE_API_KEY ??
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!key) return null;
  const url = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?fields=thumbnailLink&key=${encodeURIComponent(key)}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = (await res.json()) as { thumbnailLink?: string };
  return data.thumbnailLink ?? null;
}

async function pipeImageResponse(res: Response): Promise<NextResponse | null> {
  const ct = res.headers.get("content-type") ?? "";
  const buf = await res.arrayBuffer();
  if (buf.byteLength === 0) return null;

  if (ct.startsWith("image/")) {
    return new NextResponse(buf, {
      headers: {
        "Content-Type": ct.split(";")[0].trim(),
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
      },
    });
  }

  if ((ct.includes("octet-stream") || !ct) && isJpegOrPngMagic(buf)) {
    const u = new Uint8Array(buf.slice(0, 4));
    const mime =
      u[0] === 0xff && u[1] === 0xd8 ? "image/jpeg" : "image/png";
    return new NextResponse(buf, {
      headers: {
        "Content-Type": mime,
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
      },
    });
  }
  return null;
}

/**
 * Proxies publicly link-shared Drive images so `<img src>` gets image bytes.
 * Direct `drive.google.com/uc` / thumbnail URLs often return HTML in the browser.
 */
export async function GET(request: Request) {
  const fileId = new URL(request.url).searchParams.get("fileId")?.trim();
  if (!fileId || !FILE_ID_RE.test(fileId)) {
    return new NextResponse("Invalid fileId", { status: 400 });
  }

  const thumbFromApi = await fetchThumbnailLinkViaApi(fileId);
  if (thumbFromApi) {
    const res = await fetch(thumbFromApi, {
      redirect: "follow",
      headers: {
        Accept: "image/avif,image/webp,image/*,*/*;q=0.8",
        Referer: "https://drive.google.com/",
      },
    });
    const piped = await pipeImageResponse(res);
    if (piped) return piped;
  }

  const ua =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

  const candidates = [
    `https://drive.google.com/thumbnail?id=${encodeURIComponent(fileId)}&sz=w2048`,
    `https://drive.google.com/uc?export=download&id=${encodeURIComponent(fileId)}`,
  ];

  for (const src of candidates) {
    const res = await fetch(src, {
      redirect: "follow",
      headers: {
        Accept: "image/avif,image/webp,image/*,*/*;q=0.8",
        "User-Agent": ua,
      },
    });
    const piped = await pipeImageResponse(res);
    if (piped) return piped;
  }

  return new NextResponse(null, { status: 404 });
}
