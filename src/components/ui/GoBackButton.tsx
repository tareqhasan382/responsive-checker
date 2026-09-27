'use client';

import { Button } from '@/components/ui/Button';
import { ChevronLeftIcon } from '@/components/ui/icons';

export interface GoBackButtonProps {
  readonly className?: string;
}

/**
 * Client island for the static 404 page. `history.back()` needs an event
 * handler, which a server component cannot provide — isolating it here keeps
 * the rest of the page server-rendered and free of hydration cost.
 */
export function GoBackButton({ className }: GoBackButtonProps) {
  return (
    <Button
      variant="outline"
      size="lg"
      icon={<ChevronLeftIcon className="text-base" />}
      onClick={() => window.history.back()}
      className={className}
    >
      Go back
    </Button>
  );
}
