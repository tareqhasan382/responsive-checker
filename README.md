# Responsive UI Tester

Load any URL in an exact-size viewport and check how it responds — media queries,
`vw`/`vh` units, and layout breakpoints evaluated against a real device width.
Runs entirely in the browser.

- **No backend.** No database, auth, or external API calls.
- **Correct measurement.** The iframe is laid out at the exact logical device
  size in CSS pixels and scaled visually, so media queries always resolve
  against the device viewport rather than the window size.
- **16 built-in device presets** plus a custom viewport dialog and one-click
  portrait/landscape rotation.
- **Shareable state.** The target URL is mirrored into `?url=`, and your viewport
  setup persists in `localStorage`.

## Requirements

- Node.js 20.9+ (developed against 24.x)
- npm 10+

## Getting started

```bash
npm install
npm run dev
```

Open <http://localhost:3000>.

> **Use `localhost`, not `127.0.0.1`, when running `next dev`.** Next.js 16
> blocks cross-origin access to dev resources, so loading the dev server over
> `127.0.0.1` leaves the page unhydrated (the UI renders but does not respond).
> If you need the IP form, add `allowedDevOrigins: ['127.0.0.1']` to
> `next.config.ts`.

## Scripts

| Script                 | What it does                               |
| ---------------------- | ------------------------------------------ |
| `npm run dev`          | Development server with hot reload         |
| `npm run build`        | Production build (static export of `/`)    |
| `npm run start`        | Serve the production build                 |
| `npm run typecheck`    | `tsc --noEmit`                             |
| `npm run lint`         | ESLint (flat config, `eslint-config-next`) |
| `npm run lint:fix`     | ESLint with autofix                        |
| `npm run format`       | Prettier write                             |
| `npm run format:check` | Prettier check                             |

Run `typecheck`, `lint`, and `format:check` before opening a PR — all three are
expected to be clean.

## How the viewport works

Most "responsive preview" tools set the iframe's CSS width to a scaled-down
number, which makes `@media` queries fire at the wrong width. This tool does it
the other way around:

1. The iframe element is laid out at the **exact device size in CSS pixels**
   (e.g. 390 × 844), so the page inside sees a genuine 390px-wide viewport.
2. That element is then shrunk to fit the pane with
   `transform: scale(zoom)` and `transform-origin: top left`.
3. Because only the visual transform changes, the frame is never CSS-resized —
   media queries, `vw`, and `vh` stay accurate.

### Height modes

| Mode    | Frame height                 | Use it for                                       |
| ------- | ---------------------------- | ------------------------------------------------ |
| `auto`  | Available pane height ÷ zoom | Scrolling through long pages. **Default.**       |
| `fixed` | Exactly the device height    | Verifying `100vh` / `min-height: 100vh` layouts. |

`auto` is the default because most pages are longer than a phone screen, and a
fixed frame would force you to scroll the frame itself. `auto` caps the frame
at 5000px so a very tall pane cannot produce a pathological document.

### Fit modes

| Mode     | Behaviour                                                        |
| -------- | ---------------------------------------------------------------- |
| `width`  | Fit the frame width to the pane; height follows the height mode. |
| `screen` | Fit the whole device — width _and_ height — into the pane.       |
| `manual` | Use the zoom you set yourself.                                   |

Fit modes never exceed 100%: upscaling a frame makes it blurry and gives a
false impression of fidelity, so `Fit` clamps at 1:1 and you scroll instead.

## Limitations

**Not every site can be framed.** Servers commonly send `X-Frame-Options:
DENY`/`SAMEORIGIN` or a `Content-Security-Policy` with `frame-ancestors`, which
tells the browser to refuse rendering the page inside an iframe. The browser
blocks it and the app surfaces an error state — there is no client-side
workaround, because that is the point of those headers. Sites that allow
embedding work fine.

Related notes:

- The iframe sends `referrerPolicy="no-referrer"`, so the target does not see
  where it was embedded from.
- The iframe is sandboxed: `allow-scripts allow-same-origin allow-forms
allow-popups allow-popups-to-escape-sandbox allow-modals allow-downloads`.
  Top-level navigation is **not** permitted, so a framed page cannot redirect
  the tester itself. `allow-same-origin` is required for the target to keep its
  own cookies, which is what makes testing `http://localhost:3000` useful.
- A frame that has not fired a load event after 12 seconds is flagged as stalled
  rather than left spinning forever.

## Project structure

```
src/
├── app/                    # Next.js App Router entry, global styles, icon
│   ├── layout.tsx          # Root layout, metadata, viewport theme color
│   ├── page.tsx            # Client orchestration: measure pane, geometry, status
│   └── globals.css         # Tailwind v4 @theme tokens + utilities
├── components/
│   ├── device/             # Device preset button + list
│   ├── layout/             # App shell (header / toolbar / pane / status) and header
│   ├── ui/                 # Button, IconButton, Input, Tooltip, Dialog, Popover, icons
│   ├── url/                # URL bar, quick-target chips, validation message
│   └── viewport/           # Toolbar, preset picker, frame, preview pane, zoom controls
├── config/                 # Device presets and categories
├── hooks/                  # Persistent state, element size, target URL, viewport, zoom
├── lib/                    # `cn` class-name helper (no runtime dependencies)
├── types/                  # Shared view types
└── utils/                  # URL normalization/validation, viewport math, constants
```

## Adding a device preset

Add an entry to `VIEWPORT_PRESETS` in `src/config/viewport-presets.ts`. Portrait
sizes only — the toolbar derives landscape by rotating:

```ts
{
  id: 'pixel-fold',
  label: 'Pixel Fold',
  category: 'mobile',   // 'mobile' | 'tablet' | 'laptop' | 'desktop'
  width: 412,
  height: 915,
  devicePixelRatio: 2.625,
},
```

To change the overall zoom limits or storage keys, edit
`src/utils/constants.ts`.

## Notes on the toolchain

- **TypeScript is pinned to 6.0.3.** `typescript-eslint` does not yet support
  TypeScript 7 and requires `<6.1.0`, so the latest TS would break `npm run
lint`. If you upgrade TypeScript, upgrade `typescript-eslint` in the same
  change and re-run the lint script.
- **Tailwind v4** is configured entirely in CSS: design tokens are declared in
  the `@theme` block in `src/app/globals.css` and exposed as
  `bg-app-canvas`, `text-app-muted`, `border-app-border`, and so on. The
  palette is tuned for a dark developer tool and every text/background pair
  meets WCAG AA (≥ 4.5:1) on the surfaces it is used on.
- `cn()` in `src/lib/cn.ts` is a tiny local class-name joiner. This project has
  no runtime dependencies beyond React, so there is no `clsx`/`tailwind-merge`
  in the bundle.

## Deployment

Deploys to Vercel with no configuration:

```bash
npx vercel
```

Or push to a Git repository connected to Vercel — the default Next.js preset
builds and serves it as a static site. The app has no server-side code, no
environment variables, and no secrets, so there is nothing else to configure.

Note that when you test _your_ deployed app, make sure that app's framing
headers permit embedding. If it sends `X-Frame-Options: SAMEORIGIN` and you
deploy both the tester and the app to the same Vercel account, you may still be
blocked — deploy the tester elsewhere or relax the header for your own testing.
