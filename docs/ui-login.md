# Login screen (TripSync)

## Location

- **Route:** `/login`
- **Implementation:** [`src/app/login/page.tsx`](../src/app/login/page.tsx)

## Design intent

The sign-in experience is a **light, mobile-first card** on a soft gray canvas (`#e8eaed`), matching the product reference:

- **Branding:** Rounded-square app mark with blue→purple gradient and a white airplane-style icon; **TripSync** wordmark and tagline *All your trips. One place.*
- **Decorative row:** Three circular gradient chips with emoji (beach / plane / celebration) for visual warmth without extra assets.
- **Primary CTA:** White **Continue with Google** button with the standard multicolor Google mark, subtle shadow, and ring.
- **Legal:** Links to [`/terms`](../src/app/terms/page.tsx) and [`/privacy`](../src/app/privacy/page.tsx) (placeholder copy until real policies exist).
- **Footer strip:** Three feature hints — Split bills, Share photos, Stay synced — with emoji labels.
- **Navigation:** “Back to home” returns to `/`.

The page intentionally keeps a **fixed light appearance** on the outer shell (`dark:bg-[#e8eaed]`) so the branded card stays readable even when the OS prefers dark mode.

## Firebase misconfiguration

If public Firebase env vars are missing, the same visual language is used: centered white card with instructions (see `configError` branch in the login page).

## Related routes

| Path       | Purpose                                      |
| ---------- | -------------------------------------------- |
| `/login`   | Google sign-in UI                            |
| `/terms`   | Terms of Service placeholder                 |
| `/privacy` | Privacy Policy placeholder                   |

## Change log

- **2026-04-18:** Replaced split marketing/hero layout with centered card UI, Google mark SVG, legal links, and footer feature row; added terms/privacy placeholder pages.
