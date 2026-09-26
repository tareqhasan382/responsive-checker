# Debug Session: viewport-fit-rotate-bug

Status: [OPEN]
Session ID: viewport-fit-rotate-bug
Opened: 2026-09-26

## Symptoms (reported)
1. On a "Desktop" class view, 2K / 4K / custom viewports are expected to preview inside the desktop preview area (i.e. scale/fit so the user can see them without scrolling). The 2K/4K previews aren't fitting/resizing inside the pane.
2. Rotate viewport action "doesn't work properly" — exact failure mode unknown, likely size stays unchanged, or fit isn't re-applied, or orientation label is wrong after rotation.

## Reproduction
1. Open http://localhost:3000
2. Load any URL (or leave empty — empty state also sizes)
3. Click "2K" or "4K" category in the sidebar → expect preview to shrink/fit into visible pane; report what actually happens.
4. With any viewport active, click the rotate button (↻) in the sidebar Viewport controls → expect width/height to swap and the preview to re-fit; report what actually happens.

## Hypotheses
| # | Hypothesis | Status | Evidence |
|---|---|---|---|
| H1 | Fit mode uses pane size that includes the sidebar, or uses an outdated pane size after sidebar collapse/expand. |  |  |
| H2 | PREVIEW_GUTTER=8 conflicts with ruler 5px offsets + 1px border, causing clipping / wrong visible region. |  |  |
| H3 | `rotate()` toggles `isRotated` but fit-zoom recalculation is stale / runs before state propagates. |  |  |
| H4 | On 2K/4K click the size changes but zoom isn't automatically re-fitted (default zoom stays manual 100%). |  |  |
| H5 | `ResizeObserver` on preview pane fails to fire or reports 0, so fit math operates on stale dimensions. |  |  |

## Instrumentation points
- `useViewport.ts` → rotate, selectPreset, fit logic
- `useLayoutSize.ts` → ResizeObserver callback, paneSize
- `ViewportPreview.tsx` → contentSize / displaySize / zoom after render
- `ViewportSelector.tsx` → handleCategoryChange (2K/4K click)

## Logs endpoint
Debug server on port 8787. `GET http://127.0.0.1:8787/logs?session=viewport-fit-rotate-bug`

## Notes
