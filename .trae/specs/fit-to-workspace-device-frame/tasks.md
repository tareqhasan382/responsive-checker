# Implementation Tasks — Fit-to-Workspace Device Frame

## Task 1: Add Device Chrome / Bezel Constants and Presentation-Size Calculation Utility

**Priority**: high
**Status**: pending
**Depends On**: (none — foundational)

### Summary
Extend `viewport.ts` utilities with chrome-bezel constant definitions and a new `derivePresentationGeometry` that, given a viewport preset + category/aspect, produces the full device presentation size (viewport + bezel padding). Also add a reusable `calculateFitToWorkspace` pure function per AC-1/AC-2.

### Implementation Notes
- **File to edit**: [viewport.ts](file:///d:/projects/responsive-checker/src/utils/viewport.ts)
- Add exported bezel constants `DEVICE_BEZEL_MOBILE`, `DEVICE_BEZEL_TABLET`, `DEVICE_BEZEL_DESKTOP`, `DEVICE_BEZEL_TV` matching the spec pixel values.
- Add helper `getBezelForCategory(category: ViewportCategory, size: Size): BezelPadding` that picks the right bezel (with a custom fallback using aspect ratio).
- Add `calculateFitToWorkspace(workspace: Size, presentation: Size, maxUpscale = FIT_ZOOM_MAX): { scale: number; fittedSize: Size }` — pure function, clamp to ZOOM_MIN / FIT_ZOOM_MAX.
- Add `derivePresentationGeometry({ viewportSize, category, bezel })` returning `{ presentation, viewportInPresentation: { top, left, width, height } }` so callers know where inside the presentation box the actual viewport sits (to position the iframe and rulers correctly relative to the bezel).

### Test Requirements (TR)
- **Rule TR-1.1**: `calculateFitToWorkspace({w:1200,h:800}, {w:393,h:852}, 1).scale` equals `Math.min(1200/393, 800/852, 1)` exactly (within 0.001 tolerance). Verify with a small runtime unit test snippet in the browser console or via a temporary test file (not committing test files — just run once and log).
- **Rule TR-1.2**: Mobile bezel applied to 393×852 produces presentation size of (393+14+14) × (852+48+28) = 421 × 928. Checked by logging the output.
- **Rule TR-1.3**: Zero-sized workspace falls back to scale=1 and fittedSize=presentation (no NaN / Infinity in outputs).
- **Rule TR-1.4**: Category `'custom'` with tall aspect (>1:1) returns mobile bezel; wide returns tablet.

---

## Task 2: Integrate Presentation + Fit into useZoom / Geometry Flow

**Priority**: high
**Status**: pending
**Depends On**: Task 1

### Summary
Modify the geometry pipeline so that `deriveFrameGeometry` plus `useZoom` are aware of the presentation size and produce a `workspaceFitScale` cap. Expose enough info for `ViewportPreview` to layout the new chrome box. The effective visual scale used downstream becomes `Math.min(zoom, workspaceFitScale)` per FR-8, guaranteeing the workspace never overflows even in manual mode.

### Implementation Notes
- **Files to edit**:
  - [viewport.ts](file:///d:/projects/responsive-checker/src/utils/viewport.ts) — Update `FrameGeometryInput` and `FrameGeometry` to optionally include `presentation`, `workspaceFitScale`, and `viewportInPresentation` info, or add a parallel function.
  - [useZoom.ts](file:///d:/projects/responsive-checker/src/hooks/useZoom.ts) — Optionally accept `presentation: Size` alongside `content: Size` and `available: Size`. If provided, compute a `workspaceCap = calculateFitZoom(presentation, available, 'screen')` and the returned `zoom` becomes `Math.min(currentZoom, workspaceCap)` in all modes (including manual). This keeps the workspace guarantee at the hook level so `ViewportPreview` doesn't need its own safety cap. Report also `workspaceCapped: boolean` so the UI can optionally surface a hint.
  - [page.tsx](file:///d:/projects/responsive-checker/src/app/page.tsx) — Pass `viewport.activePreset?.category` and `viewport.size` through to compute the presentation size, then feed `presentation` into `useZoom` and `deriveFrameGeometry`. Extend the `frame` useMemo to include `presentation`, `workspaceFitScale`, and `viewportInPresentation`. Pass the new fields as props to `ViewportPreview`.

### Test Requirements (TR)
- **Rule TR-2.1**: With a tiny 500×500 pane, selecting iPhone 15 (393×852), the effective `zoom` returned by useZoom equals `Math.min(anyPriorZoom, (500-56) / 928)` because presentation height is 852+48+28=928, and workspace is 500 minus double 28px gutter → 444. So scale = 444/928 ≈ 0.478. Check via React DevTools / console log.
- **Rule TR-2.2**: Setting manual zoom to 2x in that same tiny workspace still caps the effective visual zoom to workspaceFitScale (≈0.478). The internal `storedManualZoom` remains 2 (so if the workspace grows the zoom returns).
- **Rule TR-2.3**: Normal 1920×1080 pane + 720p desktop preset has workspaceFitScale >= FIT_ZOOM_MAX (1.0), so no unintended capping happens on a regular screen.
- **Rubric TR-2.4** (scale 0-1, pass ≥1): TypeScript types compile without errors; `page.tsx` renders with no React console warnings.
  - `1`: All TS clean, no warnings.
  - `0`: TS errors or React key / prop-type warnings present.

---

## Task 3: Rework ViewportPreview Layout — Single Transform Scaling + Chrome Wrapper

**Priority**: high
**Status**: pending
**Depends On**: Task 2

### Summary
Rewrite the core of `ViewportPreview` so there is a single, outer device-wrapper sized to `fittedSize`, containing a single scaled inner device-unit that holds both the chrome visuals and the iframe. Remove the current double-sizing approach (outer wrapper at `display` size, inner iframe `transform: scale(zoom)`). Per FR-4 and AC-8, exactly one `transform: scale(...)` ancestor between preview-grid and iframe.

### Implementation Notes
- **File to edit**: [ViewportPreview.tsx](file:///d:/projects/responsive-checker/src/components/viewport/ViewportPreview.tsx)
- **File to edit (optional)**: Create a new `DeviceChrome.tsx` component in `components/viewport/` OR keep the chrome rendering inline in `ViewportPreview` as sub-functions (to avoid new files unless beneficial; inline keeps it simpler). Prefer inline to keep the change local.
- Layout structure change:
  ```
  preview-grid (unchanged — padding = PREVIEW_GUTTER)
    └─ centering flex wrapper (items-center justify-center, unchanged)
       └─ <div class="fitted-wrapper" style={{ width: fittedSize.w, height: fittedSize.h }}>   ← sized to post-fit
            └─ <div class="device-unit" style={{
                   width:  presentation.w,
                   height: presentation.h,
                   transform: `scale(${effectiveScale})`,        ← THE ONLY scale transform
                   transformOrigin: 'top left',
                   transition: 'transform 150ms ease, width 150ms ease, height 150ms ease',
                 }}>
                 // ← Device chrome visuals drawn here at natural presentation size
                 //    (rounded bezel background, notch, side buttons, status bar)
                 // ← iframe positioned absolutely at viewportInPresentation offsets
                 // ← Ruler labels positioned absolutely relative to viewportInPresentation box
               </div>
          </div>
  ```
- Add `measured` gating + skeleton/empty-state handling as before.
- **File to edit**: [ViewportFrame.tsx](file:///d:/projects/responsive-checker/src/components/viewport/ViewportFrame.tsx) — **Remove** the `transform: scale(${zoom})` style from the `<iframe>` itself (per AC-8). The iframe now keeps its natural `content.width × content.height` box; scaling is provided by the ancestor `device-unit` wrapper. Keep `width={content.width}` and `height={content.height}` attributes unchanged so the iframe's viewport size stays correct.
- Ruler repositioning: Move the ruler `<span>`s from "top: -top-5 of outer wrapper" to be centered on the viewport region using `viewportInPresentation` offsets: e.g., ruler top label sits at `{ top: viewportInPresentation.top - 20, left: viewportInPresentation.left, width: viewportInPresentation.width }` inside the device-unit (then everything scales together).

### Test Requirements (TR)
- **Rule TR-3.1**: Exactly one ancestor of the `<iframe>` has a non-identity `transform: scale(...)` in computed styles. Inspect via DevTools computed styles.
- **Rule TR-3.2**: `<iframe>` element itself has `transform: none` or absent. `width`/`height` HTML attributes exactly match the preset.
- **Rule TR-3.3**: After loading any URL, resizing the window for 5 seconds continuously, and switching presets 3 times, the iframe load handler `console.log('loaded')` fires exactly once (at initial load), not during resize/switch. Instrument temporarily by adding the log to `ViewportFrame` onLoad; verify then remove the log.
- **Rubric TR-3.4** Layout smoothness scale 0-2, pass ≥1:
  - `2`: Transitions between all presets are visually smooth, no jumps.
  - `1`: Occasional 1-frame jump visible during sidebar toggle but otherwise smooth.
  - `0`: Frequent jank / jumping.

---

## Task 4: Render Device Chrome Visuals per Category

**Priority**: medium
**Status**: pending
**Depends On**: Task 3

### Summary
Implement the chrome visual overlay within the `device-unit` wrapper: phone bezel + notch + status bar for mobile, monitor chrome for desktop, TV bezel for TV, tablet chrome for tablet. All drawn with Tailwind + inline SVG / unicode glyphs — no raster images.

### Implementation Notes
- Rendering lives inside the `device-unit` in [ViewportPreview.tsx](file:///d:/projects/responsive-checker/src/components/viewport/ViewportPreview.tsx).
- Drive chrome style selection via `viewport.activePreset?.category` plus the aspect-ratio fallback for `custom`.
- Mobile chrome specifics (match reference screenshot):
  - Outermost: near-black rounded-rect background (e.g., `bg-[#0f0f10]`, `rounded-[48px]`, inset `border border-black/80`, `shadow-2xl shadow-black/60`).
  - Top bezel area above viewportInPresentation.top: status bar row containing `09:11` (white, font-semibold) on left, plus inline SVG signal-bars / Wi-Fi / battery icons on right (use small inline SVGs or unicode glyphs).
  - Notch / dynamic island: a smaller rounded-rect black overlay centered horizontally in the top bezel area, slightly overlapping the status bar.
  - Side buttons: on left edge, 2–3 small vertical rectangles (volume up/down, mute), one on right edge (power) — rendered as `absolute` positioned divs with `bg-zinc-700`.
  - Bottom bezel: thin home-indicator bar (horizontal white rounded pill, centered, narrow).
- Desktop chrome:
  - Monitor window: `bg-zinc-800` rounded outer, `bg-zinc-900` inner bezel around viewport, top "title bar" 40px tall with 3 small circles (red/yellow/green traffic lights) on the left.
  - Stand/base: a `bg-zinc-700` trapezoid-ish block below the viewport area (achievable with two divs, a wide rectangle for the neck and a wider rectangle for the base).
- TV chrome:
  - Chunky `bg-black` rounded bezel all around, with TV stand below.
  - Optional small logo text centered in bottom bezel (e.g., "TV" subtle).
- Tablet chrome:
  - Medium `bg-zinc-900` rounded border, small camera dot (circle) in top bezel center.
- Custom: pick based on aspect ratio.

### Test Requirements (TR)
- **Rubric TR-4.1** Visual quality scale 0-2, pass ≥1 (matches AC-10):
  - `2`: Mobile chrome has clear rounded black bezel, notch/dynamic-island cutout, status bar with time + icons, side buttons, home indicator. Desktop looks like a monitor with title bar and stand. TV has chunky bezel + stand.
  - `1`: Chrome present, clearly differentiated by category, but missing some details (e.g., no notch or simplified icons).
  - `0`: Same plain border as before, or chrome same for all categories.
- **Rule TR-4.2**: All chrome decorative DOM elements have `aria-hidden="true"` or are in a container with it (per NFR-5). Checked via DevTools.
- **Rule TR-4.3**: Ruler labels remain readable and do not overlap chrome. Checked visually across 3+ presets (portrait phone, landscape phone, 4K TV).

---

## Task 5: Verify Acceptance Criteria End-to-End + Fix Regressions

**Priority**: high
**Status**: pending
**Depends On**: Tasks 1–4

### Summary
Run the full acceptance-criteria checklist from spec.md against a live-running dev server. Fix any regressions uncovered, especially:
- 4K preset not fitting (use TR-2.1 as early signal, then confirm with real workspace)
- Landscape orientation (width > height) + tall workspace correctly caps on width axis
- Sidebar collapse/expand triggers re-measure and refit
- Manual zoom: slider says "200%" but in a small workspace the effective zoom is visibly lower and device does not overflow; the saved `manualZoom` persists so enlarging the workspace later returns to 200%.

### Implementation Notes
- Start `next dev` via `npm run dev`.
- For each rule AC-1 through AC-9, record pass/fail and a brief evidence note (screenshot description, console log, etc.).
- Run `GetDiagnostics` for TypeScript / lint errors; fix any that arise.
- If any AC fails, loop back to the relevant task (e.g., Task 2 for fit-calculation bugs, Task 3 for layout bugs, Task 4 for chrome bugs) — no need to modify task statuses, just fix and re-verify.

### Test Requirements (TR)
- **Rule TR-5.1**: `GetDiagnostics` reports zero errors.
- **Rule TR-5.2**: `npm run lint` passes with no new warnings (if script exists; check package.json first).
- **Rule TR-5.3**: Manual E2E walkthrough:
  1. Load app.
  2. Enter `https://example.com`.
  3. Click **iPhone 15** → device fully visible, no scrollbars, chrome present with notch + status bar. (AC-1/AC-2/AC-10)
  4. Click rotate → landscape, fully visible, no stretch (viewport aspect 852×393). (AC-3/AC-6)
  5. Click **UHD 4K TV** → fully visible, TV chrome, tiny (≈2–5% zoom) but fits. (AC-1/AC-2)
  6. Shrink browser window to ~600×600 → all devices still fit, no document-level scroll. (AC-5/NFR-3)
  7. Toggle sidebar → device rescales without overflow, no iframe reload. (AC-7/AC-11)
  8. Manual zoom slider to 200% in small workspace → device still fits (capped), slider shows 200%. (FR-8)
  9. Enlarge window back to full → device re-grows toward 200% as workspace allows (capped at FIT_ZOOM_MAX=1 unless FIT_ZOOM_MAX allows, but FIT_ZOOM_MAX=1 per constants, so 200% effectively tops at 100% for built-in fit modes; confirm behavior is consistent and documented).
- **Rubric TR-5.4** (AC-12) Layout smoothness 0-2, pass ≥1.

---

## Task 6: Completion Evidence & Cleanup

**Priority**: low
**Status**: pending
**Depends On**: Task 5

### Summary
- Remove any temporary instrumentation (console.logs added for verification).
- Confirm package.json scripts run without errors (build if practical, or at minimum lint + typecheck via GetDiagnostics).
- Record final acceptance evidence in each task's "Completion Evidence" section.

### Implementation Notes
- No new files; only edits to remove debug prints if added.
- Double-check no regressions: empty-state renders, skeleton renders before first measure.

### Test Requirements (TR)
- **Rule TR-6.1**: No stray `console.log` / `debugger` statements in modified source files (grep).
- **Rule TR-6.2**: Skeleton / empty-state still render correctly before first valid measure + with no URL.
