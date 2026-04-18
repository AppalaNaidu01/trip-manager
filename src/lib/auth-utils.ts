/**
 * Mobile browsers and many in-app WebViews block or break `signInWithPopup`.
 * Use `signInWithRedirect` instead when this returns true, and handle the return
 * with `getRedirectResult` on app load.
 */
export function prefersAuthRedirect(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  if (/Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
    return true;
  }
  // iPadOS 13+ can report as MacIntel with touch
  if (navigator.maxTouchPoints > 1 && /Macintosh/.test(ua)) {
    return true;
  }
  return false;
}
