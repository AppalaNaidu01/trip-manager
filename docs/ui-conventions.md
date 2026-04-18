# UI conventions (TripSync)

## Brand palette

| Role | Value | Usage |
| ---- | ----- | ----- |
| Page / app background (app shell) | `#F9F9F7` | Dashboard, trip detail, create trip body |
| Primary / brand green | `#14532d` | Headings, primary buttons, selected chips, trip title accents |
| White | `#ffffff` | Cards, header bars |
| Text primary | `#0f172a` (slate-900 family) | Body copy |

Use existing Tailwind arbitrary values (e.g. `bg-[#F9F9F7]`, `text-[#14532d]`) where components already do.

## TripSync wordmark in headers

**Dashboard** and **Create trip** center titles use the same pattern:

- `text-sm font-semibold uppercase tracking-[0.16em] text-[#14532d]`
- Wrapped in `text-center` inside a **three-column grid** so the label stays centered with left (menu or back) and right (profile or spacer) columns of equal visual weight.

Headers use `border-b border-slate-200/90` and `bg-white/95` for separation from content.

## Cover and media aspect ratio

These should stay **consistent** so covers look the same everywhere:

- **16∶10** — `aspect-[16/10] w-full` for trip hero on detail, dashboard featured cards, create-trip cover slot, overview “Trip look” editor.

## Route journey map

- Map container uses **`aspect-[4/3]`** for the illustrative map area (see `TripRoutePanel`).
- Legend list appears **directly under** the map frame (start → stops → destination).

## Form controls

- Create trip and similar forms: rounded **2xl** fields, light gray fills (`#f4f4f0` pattern), forest green **uppercase micro-labels** for section labels.
- **Date inputs**: use native `type="date"` only; do not overlay extra calendar icons (browsers provide a picker control; duplicates look broken).

## Photos grid

- Masonry-style columns; **do not** assign arbitrary `min-height` to figure tiles — images use natural height (`block w-full h-auto`) so tiles are not left with empty space below the image.

## Accessibility

- Prefer visible labels or `aria-label` on icon-only buttons (close, photo viewer, share).
- Lightbox: `role="dialog"`, `aria-modal`, Escape to close.
