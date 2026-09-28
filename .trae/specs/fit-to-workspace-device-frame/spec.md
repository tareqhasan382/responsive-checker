# Fit-to-Workspace Device Frame Specification

## Problem

The responsive checker application currently renders device previews with a minimal border frame and does not guarantee that the complete device presentation (including rulers, potential bezels, and status bars) always fits strictly within the available preview workspace. Current "screen fit" mode attempts to fit only the logical viewport dimensions, but:

1. Ruler labels sit outside the frame border by ~20px and are clipped when gutters are insufficient (already partially mitigated by PREVIEW_GUTTER=28, but no hard guarantee for the compound presentation)
2. There is no device bezel/frame overlay, so the device does not visually resemble a real phone/tablet/TV
3. The fit calculation accounts only for `content.width × content.height` (the viewport itself), not the complete visual presentation including any frame chrome added around it
4. When the workspace is very small (e.g., browser window shrunk, sidebar expanded), there is no upper bound that clamps output to guarantee zero overflow on either axis
5. No reusable "fit-to-workspace" primitive exists that callers can rely on for the invariant "device never goes outside visible area"

## Users

- **Primary**: Developers and QA engineers testing responsive layouts who need to see an accurate, always-visible representation of the target device while switching between many device presets quickly.
- **Secondary**: Non-technical stakeholders reviewing responsive designs who expect a realistic device frame and never want to scroll to see a clipped phone screen.

## Goals

1. **Fit Guarantee**: The entire device presentation (frame chrome + bezel + viewport + rulers/labels) must remain 100% inside the available preview workspace at all times. No horizontal or vertical overflow, no clipping, no scrolling required.
2. **Proportional Scaling**: Only uniform (aspect-ratio-preserving) scaling. Never stretch width or height independently.
3. **Correct Viewport**: The actual responsive website inside the iframe must always receive the original CSS-pixel dimensions of the selected preset. Visual scaling must be achieved by CSS transform only.
4. **Responsive to All Changes**: Recompute fit whenever browser window, preview pane, sidebar, toolbar, device preset, or orientation changes.
5. **Centered Layout**: Horizontally and vertically center the scaled device within the workspace.
6. **Device Frame Visual**: Add a realistic device chrome/bezel overlay around the viewport (matching the reference screenshot style: black bezel, notch for iPhones, side buttons, rounded corners, status bar area).
7. **Scale the Whole Unit**: Apply the computed scale factor to the COMPLETE device presentation (chrome + screen + iframe) as one atomic visual unit.

## Non-Goals

1. **Not a design system**: The device chrome visuals are functional and realistic-looking but not infinitely themeable; a per-category set of chrome styles (phone, tablet, desktop, TV) is sufficient.
2. **No physical-device accuracy**: Bezels do not need to match exact mm measurements of specific iPhone/Android models; they need to visually read as "a phone/tablet frame" and be internally proportional.
3. **No multi-device compare view**: This spec covers the single-device preview only.
4. **No iframe content manipulation**: We do not inject styles or scripts into the target page to force-fit it; all scaling happens on our side via CSS transform on our wrapper elements.

## Functional Requirements

### FR-1: Fit-to-Workspace Calculation (Reusable)

A reusable calculation function `calculateFitToWorkspace` that, given:

- `workspaceSize: Size` — available pixel dimensions of the preview area (after subtracting toolbar, gutters, padding)
- `devicePresentationSize: Size` — pixel dimensions of the COMPLETE device visual unit (bezel/chrome outer box, not just the inner viewport)
- `maxUpscale: number` — maximum allowed upscale factor (default `1`, i.e., never upscale beyond 100% because upscaled frames are blurry and misleading per existing `FIT_ZOOM_MAX`)

Returns:

```
{
  scale: number;        // Math.min(workspace.w / device.w, workspace.h / device.h, maxUpscale)
  fittedSize: Size;     // devicePresentationSize * scale (rounded to whole pixels)
  offset: { x: number; y: number };  // centering offset within workspace
}
```

The function must guard against zero / negative inputs by returning `scale = 1`.

### FR-2: Device Presentation Size Model

For each device category (mobile, tablet, desktop, 2k, 4k, tv, custom), derive a `devicePresentationSize` = outer size of the chrome, computed as:

- For mobile / tablet / custom-portrait-aspect: chrome adds padding around the viewport (bezel width on all 4 sides, plus top status-bar/notch area and optional bottom home-indicator area)
- For desktop / 2k / 4k / tv: chrome adds a thin monitor bezel or TV frame

Constants for chrome padding (pixels, at zoom=1):

- `DEVICE_BEZEL_MOBILE`: `{ top: 48, right: 14, bottom: 28, left: 14 }` (status bar 48px, side bezels 14px, bottom home area 28px)
- `DEVICE_BEZEL_TABLET`: `{ top: 32, right: 20, bottom: 20, left: 20 }`
- `DEVICE_BEZEL_DESKTOP`: `{ top: 40, right: 12, bottom: 60, left: 12 }` (title bar 40px, stand/base 60px)
- `DEVICE_BEZEL_TV`: `{ top: 24, right: 24, bottom: 56, left: 24 }` (bezel all around + TV base 56px)

The outer presentation size is therefore:

```
presentationWidth  = viewportWidth  + bezel.left + bezel.right
presentationHeight = viewportHeight + bezel.top  + bezel.bottom
```

This model intentionally keeps the chrome a constant-pixel add-on at zoom=1, so thin bezels on small devices do not get absurdly thin at tiny zoom levels; the whole presentation scales together via the single `scale` factor.

### FR-3: Dynamic Workspace Measurement

Use `ResizeObserver` (already available via `useElementSize`) on the preview pane container. The "workspace" passed to the fit calculation is:

```
workspace.width  = pane.clientWidth  - PREVIEW_GUTTER * 2  // horizontal gutter already reserved for rulers
workspace.height = pane.clientHeight - PREVIEW_GUTTER * 2  // vertical gutter
```

This must be recomputed whenever any of the following changes:
- Browser window resize (already captured by ResizeObserver on the pane element, which is a flex child of the viewport-sized AppShell)
- Preview pane resize (ditto)
- Device preset change → `viewport.size` changes → `devicePresentationSize` changes
- Orientation change (rotate) → `viewport.size` swaps → `devicePresentationSize` changes
- Sidebar collapse/expand → triggers pane `ResizeObserver` because the pane flex width changes
- Any toolbar/UI above the pane that changes height → triggers pane `ResizeObserver`

### FR-4: Scale Application — Single Transform on the Whole Device

In `ViewportPreview`, replace the current two-level sizing approach (outer `display` sized wrapper + inner iframe `transform: scale(zoom)`) with a single unified model:

1. An outer wrapper sized exactly to `fittedSize` (the post-fit presentation), centered via flexbox within the padded preview grid.
2. An inner "device unit" div that:
   - Has natural CSS dimensions of `devicePresentationSize` (viewport + bezel areas laid out at full logical size)
   - Applies `transform: scale(scale)` with `transform-origin: top left`
   - Contains the bezel chrome visuals (background, rounded corners, notch, buttons) rendered at full natural size
   - Contains the iframe positioned absolutely inside the viewport region, with the iframe itself at `content.width × content.height` **without a second transform** (the outer device-unit scale already scales everything, including the iframe)

The iframe must still report a viewport of exactly the preset CSS pixels. Because the iframe's intrinsic `width`/`height` attributes and CSS box are set to the preset size, and the only scaling is an ancestor `transform`, the iframe's internal layout viewport is the preset size — satisfying the "website sees real dimensions" requirement.

### FR-5: Centering

The fitted device is horizontally and vertically centered within the workspace using the existing flex layout (`items-center justify-center`) on the preview-grid inner wrapper. No additional JavaScript pixel offsets are needed for centering; the flex layout plus the wrapper being exactly `fittedSize` handles it.

### FR-6: Device Frame/Bezel Visuals

Add a new `DeviceChrome` component (or extend the inline rendering inside `ViewportPreview`) that draws the frame chrome. Visuals per category:

- **Mobile (aspect ratio portrait, width ≤ 500px)**:
  - Outer shape: black rounded rectangle (`rounded-[48px]` at natural size, corner radius scales with the device unit)
  - Notch/dynamic-island cutout at top center (a smaller black rounded rect overlaying the top bezel)
  - Volume buttons on left edge, power button on right edge (thin gray rectangles)
  - Status bar area inside the top bezel (within the bezel padding, before the viewport starts): show time "09:11" left-aligned, signal/Wi-Fi/battery icons right-aligned (matching the reference screenshot)
  - Optional: home indicator / bottom swipe bar centered in bottom bezel area
  - Background of bezel area: linear dark gradient / near-black solid

- **Tablet (width 500–1300, aspect roughly 3:4 or close)**:
  - Black or silver rounded outer shape (`rounded-[32px]`)
  - Camera dot on top bezel
  - Optional: thin side bezels

- **Desktop / 2K / 4K**:
  - Monitor chrome: title bar area above viewport with 3 traffic-light dots on the left or a URL bar look
  - Stand/base area below: a gray trapezoid or rectangle representing the monitor stand
  - Bezel around viewport: thin gray line

- **TV**:
  - Dark chunky bezel all around (`rounded-[16px]`)
  - TV stand/base at bottom
  - Optional: manufacturer logo centered in bottom bezel

- **Custom / fallback**:
  - Mobile chrome if aspect ratio is taller than 1:1, tablet chrome otherwise

All chrome visuals are rendered purely with Tailwind classes + inline SVG icons (no external image assets required, for a self-contained result per the user's request to "add an image" — interpreted as "visual overlay chrome that looks like the screenshot").

### FR-7: Ruler Labels — Repositioned Relative to Device Unit

The current rulers are positioned absolutely inside a `display`-sized wrapper using `-top-5` / `-left-5`, which assumes the wrapper is the viewport size. With the new layout the wrapper is the fitted presentation size (bigger than the viewport). Move rulers so that:

- Horizontal ruler label sits above the viewport region, centered on the viewport's width, not the presentation's width
- Vertical ruler label sits to the left of the viewport region, centered on the viewport's height
- Both remain outside the bezel by enough margin to not overlap chrome

### FR-8: Compatibility with Manual Zoom / Fit Mode

The existing `FitMode` (width / screen / manual) and zoom controls must keep working:

- In `screen` and `width` fit modes: the zoom hook produces a `zoom` value, AND the new fit-to-workspace calculation produces a `scale`. The effective visual scale applied to the device unit is `Math.min(zoom, workspaceFitScale)`. This preserves the hard fit guarantee (workspaceFitScale caps any user-chosen zoom that would overflow) while still respecting width-fit vs screen-fit intent when there is room.
- In `manual` mode: user zoom value is still capped by workspaceFitScale to guarantee the invariant. The UI tooltip / label for "Zoom" should reflect the applied value if a cap occurs (e.g., show both "user requested 150%" and "displayed at 82% (fit-capped)"). This prevents confusion when the manual-zoom slider does not appear to respond because it is being workspace-capped.
- `FIT_ZOOM_MAX = 1` (no upscaling beyond 100%) is respected by both axes.

## Non-Functional Requirements

### NFR-1: No Layout Jitter

Changing device presets, rotating, or resizing the window must not cause the device to "jump" visibly. Smooth transitions are desirable: add a 150–200ms CSS transition on `transform` and `width`/`height` of the device wrapper, applied only after the first paint (so initial load is not animated).

### NFR-2: No Iframe Reload on Rescale

Changing scale / workspace size / zoom must not cause the iframe to reload. The iframe's `src` and `key` must only change when `target URL`, `force-embed`, or the `reloadKey` (user action) change.

### NFR-3: SSR / Hydration Safety

All measurement-driven values (workspace size, hence scale / fittedSize) must produce a safe fallback before the first `ResizeObserver` callback fires. The existing `measured` flag gates rendering; keep that behavior and additionally ensure `useMemo` / `useEffect` flows never produce NaN or negative sizes even on the first render.

### NFR-4: Performance

The fit calculation runs on every `ResizeObserver` tick. Keep it O(1). Avoid creating new objects inside render paths where stable memoized values suffice. The `ResizeObserver` already coalesces resize events; no extra throttle/debounce is needed.

### NFR-5: Accessibility

- The device chrome is purely decorative and must be `aria-hidden="true"` or otherwise excluded from the accessibility tree.
- The iframe must retain a proper `title` ("Target page preview").
- Ruler labels remain visible text and must not be hidden inside decorative SVG/overlay elements.
- Color contrast of status bar elements against dark bezel must meet at least 4.5:1.

### NFR-6: Backward Compatibility with Storage Keys

No storage key changes are required. Existing `:v2` keys for fitMode and heightMode keep their current defaults (`fitMode='screen'`, `heightMode='fixed'`). The new fit-to-workspace invariant transparently tightens the behavior of `'screen'` mode without changing stored user preferences.

## Constraints & Dependencies

### Hard Constraints (from project_memory)

1. `PREVIEW_GUTTER` must remain at least 28px.
2. `ZOOM_MIN` remains 0.02 (2%) so 4K can fit.
3. In `heightMode='fixed'`, zoom must be the `Math.min` of width-fit and height-fit ratios — the existing code already does this; the new work does not regress it.
4. `FitMode` default is `'screen'`, `heightMode` default is `'fixed'`.
5. Storage keys use `:v2` suffix where applicable; do not reset them.

### Dependencies

- Existing `useElementSize` hook (ResizeObserver) — reused.
- Existing `useZoom` hook — modified to also accept / report a workspace cap.
- Existing `deriveFrameGeometry` — modified to compute presentation size alongside content / display size.
- Existing viewport presets and categories — no additions; the chrome selection is driven by category + aspect ratio.

## Assumptions

1. The user's "ekta image add korechi erokom device frame cover takbe" ("add an image, device frame cover should be like this") refers to the provided reference screenshot showing a black iPhone-style bezel with notch, status bar time/icons, and side buttons. We implement this as CSS-drawn chrome + inline SVG icons, not a raster image asset, because a CSS-drawn chrome scales cleanly with the device unit and avoids blurriness.
2. Ruler labels will still be shown; they are not removed. They are just repositioned to sit around the viewport, not around the presentation wrapper.
3. When manual zoom is capped by the workspace, showing a subtle hint in the UI is acceptable but not required to satisfy the acceptance criteria. The hard invariant (no overflow) is what matters.

## Open Questions

None. Ambiguities have been resolved above by Assumptions 1–3.

---

## Acceptance Criteria

### Rule AC-1: No Horizontal Overflow
**Pass condition**: For every built-in viewport preset (mobile, tablet, desktop, 2K, 4K, TV) in both portrait and landscape orientation, and with the sidebar both expanded and collapsed, the outermost device wrapper's right edge never exceeds `pane.clientWidth - PREVIEW_GUTTER` and its left edge is never less than `PREVIEW_GUTTER`. Measurable at runtime via `getBoundingClientRect` on the device wrapper compared to the pane.
**Evidence source**: DevTools element inspection + manual resize testing.

### Rule AC-2: No Vertical Overflow
**Pass condition**: Same as AC-1 for the vertical axis: top edge ≥ `PREVIEW_GUTTER` from pane top, bottom edge ≤ `pane.clientHeight - PREVIEW_GUTTER`.
**Evidence source**: DevTools element inspection + manual resize testing.

### Rule AC-3: Proportional Scaling
**Pass condition**: For any device preset, `(fittedSize.width - bezelLR) / (fittedSize.height - bezelTB) === viewport.width / viewport.height` to within 1px rounding tolerance. Equivalently: `(displayedViewportWidth / displayedViewportHeight) === (originalWidth / originalHeight)`.
**Evidence source**: Runtime console log of sizes after fit calculation + visual inspection.

### Rule AC-4: Correct Iframe Viewport Size
**Pass condition**: The iframe's `width` and `height` HTML attributes and CSS `width`/`height` properties are exactly equal to the selected viewport preset's width and height (or swapped if rotated). Not scaled values.
**Evidence source**: DevTools DOM inspection of `<iframe>` attributes.

### Rule AC-5: Recompute on Resize
**Pass condition**: Shrinking the browser window height by 200px and releasing the resize, then selecting the 4K UHD preset (3840×2160), results in a visible fitted device entirely within the new smaller pane with no page-level vertical scrollbar appearing on `document.documentElement` (scrollHeight === clientHeight).
**Evidence source**: Manual resize test + `document.documentElement.scrollHeight === document.documentElement.clientHeight` check in console.

### Rule AC-6: Recompute on Device Change / Rotate
**Pass condition**: Selecting "iPhone 15" (393×852), then clicking rotate, then selecting "UHD 4K TV", results in all three states being fully visible with zero clipping of the device chrome.
**Evidence source**: Visual inspection + DOM bounding rect checks.

### Rule AC-7: Recompute on Sidebar Toggle
**Pass condition**: With the sidebar collapsed and a tall device (iPhone 15 portrait) selected, toggling the sidebar to expanded must not cause vertical or horizontal overflow; the fit rescales to the new narrower pane width automatically within one animation frame (≤ 16ms in practice, observable as no "flash of oversized device").
**Evidence source**: Manual sidebar toggle + bounding rect check.

### Rule AC-8: Single Scale, Whole Unit
**Pass condition**: There is exactly one `transform: scale(...)` CSS property applied between the preview-pane flex wrapper and the iframe, and it is on a parent that also contains the bezel/chrome DOM children. The iframe element itself does NOT have `transform: scale` applied. (Prevents double-scaling bugs and ensures the chrome scales with the screen.)
**Evidence source**: DevTools computed styles inspection of iframe and its ancestors.

### Rule AC-9: Centering
**Pass condition**: With any device selected, `(deviceWrapper.getBoundingClientRect().left - pane.getBoundingClientRect().left - PREVIEW_GUTTER) === (pane.clientWidth - PREVIEW_GUTTER*2 - deviceWrapperRect.width) / 2` to within ±2px. Same for vertical axis.
**Evidence source**: DevTools console check.

### Rubric AC-10: Visual Quality of Device Chrome
**Scale 0–2, pass threshold ≥ 1**:
- `2`: Chrome clearly communicates device category (mobile looks like a phone with notch and status bar, desktop looks like a monitor, TV looks like a TV). Rounded corners, bezel proportions, and status icons match the reference screenshot feel.
- `1`: Chrome exists and is distinguishable by category but corners / icons / proportions are rough or do not closely match the screenshot style.
- `0`: No visible chrome / same as the old plain border.
**Evidence source**: Visual screenshot comparison to the provided reference image.

### Rule AC-11: No Iframe Reload During Rescale
**Pass condition**: After loading a target URL successfully (frame status 'ready'), resizing the browser window continuously for 5 seconds, then changing device preset 3 times, and finally checking the iframe's `src` attribute — it must not have had its `key` prop change (React does not re-mount the iframe). Additionally, a `console.log` placed once at iframe load time fires only once (during initial load), not during rescaling.
**Evidence source**: Instrumentation log + React DevTools key inspection.

### Rubric AC-12: Layout Smoothness
**Scale 0–2, pass threshold ≥ 1**:
- `2`: Transitions between devices/orientations/window sizes are smooth and continuous. No visible jumps, flashes, or size "bouncing". At most a subtle 150–200ms ease.
- `1`: Transitions mostly work but one of the transitions (e.g., sidebar toggle) has a visible one-frame jump or slight flash.
- `0`: Frequent jumps, re-layout flashes, or device visibly overshoots before correcting.
**Evidence source**: Manual interaction video / visual observation.
