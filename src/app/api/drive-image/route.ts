import { NextResponse } from "next/server";

const FILE_ID_RE = /^[a-zA-Z0-9_-]+$/;

/**
 * Proxies publicly link-shared Drive images so `<img src>` gets image bytes.
 * Direct `drive.google.com/uc` / thumbnail URLs often return HTML in the browser.
 */
export async function GET(request: Request) {
  const fileId = new URL(request.url).searchParams.get("fileId")?.trim();
  if (!fileId || !FILE_ID_RE.test(fileId)) {
    return new NextResponse("Invalid fileId", { status: 400 });
  }

  const candidates = [
    `https://drive.google.com/thumbnail?id=${encodeURIComponent(fileId)}&sz=w2048`,
    `https://drive.google.com/uc?export=download&id=${encodeURIComponent(fileId)}`,
  ];

  const ua =
    "Mozilla/5.0 (compatible; TripManagerImageProxy/1.0; +https://localhost)";

  for (const src of candidates) {
    const res = await fetch(src, {
      redirect: "follow",
      headers: {
        Accept: "image/avif,image/webp,image/*,*/*;q=0.8",
        "User-Agent": ua,
      },
    });
    const ct = res.headers.get("content-type") ?? "";
    if (res.ok && ct.startsWith("image/") && res.body) {
      return new NextResponse(res.body, {
        headers: {
          "Content-Type": ct,
          "Cache-Control": "public, max-age=86400, s-maxage=86400",
        },
      });
    }
  }

  return new NextResponse(null, { status: 404 });
}
