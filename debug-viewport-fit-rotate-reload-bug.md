# Debug Session: `viewport-fit-rotate-reload-bug`

- **Status**: [OPEN]
- **Started**: 2026-09-27
- **Summary**: User reports 3 issues: (1) 2K/4K/custom must fit inside desktop preview pane with ZERO horizontal (x-axis) scroll; (2) Rotate must produce "real-device" like sizes — mobile portrait rotated becomes wider (landscape) on x-axis, desktop rotated becomes taller (portrait) on y-axis; (3) NEW BUG: click Mobile/Tablet preset → reload page → Desktop (4K/Default) selected instead of original preset.
- **Acceptance Criteria**:
  - (A) No horizontal (x-axis) scrollbar or overflow in preview pane for ANY preset/category/rotate/custom combination up to MAX 5000×5000.
  - (B) Rotate swaps W↔H correctly and sidebar label shows correct orientation. Visual sizes match real-device dimensions.
  - (C) Page reload: selected preset/category (Mobile/Tablet/Desktop/2K/4K/custom) AND size AND rotate state persist from pre-reload URL.

## Hypotheses

| # | Issue | Falsifiable Hypothesis | Verification |
|---|-------|------------------------|--------------|
| A1 | (1) X-axis scroll | `calculateFitZoom` width-ratio clamp is correct BUT `ZOOM_MIN=0.02` still too coarse for max 5000 wide in small panes. | compute 5000/(240)=0.048 ≤ 0.02? NO, 0.048 > 0.02 so OK. But check 5000 in 100px → 0.02. |
| A2 | (1) X-axis scroll | `preview-grid` has `overflow-auto` which allows BOTH axis scroll. To guarantee x never scrolls need `overflow-x-hidden overflow-y-auto`. Belt-and-suspenders fix. | DOM-check computed overflow-x of `.preview-grid` pre/post fix. |
| A3 | (1) X-axis scroll | In `heightMode='auto'` width-fit zoom computed correctly BUT innerContent 3840px div is overflowing in x because the wrapper `size-full` border div doesn't clip. CHECK: border div has `overflow-hidden`? YES it does from previous fix. Maybe horizontal scroll happens BEFORE ResizeObserver measures (flash)? | Log paneSize first-value timing. |
| B1 | (2) Rotate visual size | Mobile rotated W=667 H=375. heightMode='auto' default sets content.height = available/zoom. So width 667 fits → zoom = 240/667 = 0.36. Then content.height = 547/0.36 ≈ 1520px. Display.height = 1520 × 0.36 ≈ 547 = fills pane. User expects "real device aspect" 667×375 displayed proportional (not stretched to fill pane height). EXPECTED: for mobile devices in landscape rotated, user wants FIXED height mode semantic, not auto fill. OR the issue is opposite direction. | After click mobile then rotate, compare content W×H + display W×H + sidebar label says correct orientation. Ask user's expectation: does they want heightMode default to 'fixed' for mobile? |
| B2 | (2) Rotate working | `rotateSize()` returns swapped size, useMemo dependency chain works, but zoom fit doesn't trigger if mode='manual'. | Check `fitMode` state before/after rotate. |
| C1 | (3) Reload resets to Desktop | `useViewport` initial state `baseSize` read from URL searchParams, but parsing returns NaN or undefined → falls back to default desktop 1280×720 base. | Log URL parsed values on mount + activePreset + isRotated. |
| C2 | (3) Reload resets to Desktop | Category chips' pressed state is derived from `findPresetBySize` using base size; but after reload, if `isRotated` true → size is SWAPPED (rotated) but `baseSize` isn't restored correctly (base = rotated instead of original base). So category matches wrong (no category = falls back to desktop pressed via default). | Log URL w,h,rotated raw + parsed baseSize + isRotated flag + activePreset.label. |
| C3 | (3) Reload resets to Desktop | Page.tsx only syncs URL to state on 'url' param (the website URL) not viewport w/h/rotated params. Or there's a race: viewport state initializes DEFAULT, then useEffect reads URL too late and updates state, BUT the category pressed chip was already drawn in DOM and doesn't re-paint OR the URL param keys don't match. | Search URL param names used for viewport size vs what's written to the URL. |

## Log Structure (ndjson)
- Event names: `viewport.mount.init`, `viewport.url.parse`, `viewport.preset.click`, `viewport.rotate.click`, `zoom.recalc`, `frame.geometry`, `pane.resize`
- Fields: `ts`, `evt`, `data`, `stack?`

## Checklist
- [ ] Step 1. Instrument useViewport, page.tsx, useZoom
- [ ] Step 2. Reproduce all 3 bugs & collect logs
- [ ] Step 3. Confirm/reject hypotheses
- [ ] Step 4. Apply minimal fixes per confirmed bug
- [ ] Step 5. Post-fix re-measurement pass
- [ ] Step 6. Lint + typecheck + user confirm
