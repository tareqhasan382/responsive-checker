'use client';

import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { ExternalLinkIcon, ReloadIcon } from '@/components/ui/icons';
import type { UseZoomResult } from '@/hooks/useZoom';
import type { HeightMode, Size } from '@/types/viewport';
import { formatSize } from '@/utils/viewport';
import { ZoomControls } from './ZoomControls';

export interface PreviewToolbarProps {
  readonly zoom: UseZoomResult;
  readonly heightMode: HeightMode;
  /** The selected device size — what the target page actually receives. */
  readonly viewport: Size;
  readonly target: string | null;
  readonly onReload: () => void;
}

/**
 * The bar directly beneath the preview: zoom on the left, viewport readout and
 * target actions on the right. Collapses to a single wrapped row on narrow
 * screens rather than scrolling horizontally.
 */
export function PreviewToolbar({
  zoom,
  heightMode,
  viewport,
  target,
  onReload,
}: PreviewToolbarProps) {
  return (
    <div className="border-app-border bg-app-panel flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2 border-t px-3 py-2">
      <ZoomControls zoom={zoom} heightMode={heightMode} />

      <div className="ml-auto flex items-center gap-2">
        <span className="text-app-subtle text-[11px]">
          Viewport{' '}
          <span className="text-app-muted font-mono tabular-nums">
            {formatSize(viewport)}
          </span>
        </span>

        <IconButton
          label="Reload the page in the frame (R)"
          size="sm"
          icon={<ReloadIcon />}
          disabled={target === null}
          onClick={onReload}
        />

        <Button
          size="sm"
          variant="outline"
          icon={<ExternalLinkIcon />}
          disabled={target === null}
          onClick={() => {
            if (target !== null)
              window.open(target, '_blank', 'noopener,noreferrer');
          }}
        >
          Open
        </Button>
      </div>
    </div>
  );
}
