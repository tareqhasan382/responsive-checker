'use client';

import { MonitorIcon, MoonIcon, SunIcon } from '@/components/ui/icons';
import { THEME_LABELS, THEME_PREFERENCES } from '@/config/theme';
import type { ThemePreference } from '@/config/theme';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/cn';

const ICONS: Record<ThemePreference, typeof SunIcon> = {
  light: SunIcon,
  dark: MoonIcon,
  system: MonitorIcon,
};

/**
 * Three-state theme switch rendered as one segmented control, so the current
 * choice is always visible rather than hidden behind a menu.
 */
export function ThemeToggle({ className }: { readonly className?: string }) {
  const { preference, setPreference } = useTheme();

  return (
    <div
      role="radiogroup"
      aria-label="Colour theme"
      className={cn(
        'border-app-border bg-app-elevated flex items-center overflow-hidden rounded-md border',
        className,
      )}
    >
      {THEME_PREFERENCES.map((option) => {
        const Icon = ICONS[option];
        const active = preference === option;
        return (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={active}
            title={THEME_LABELS[option]}
            onClick={() => setPreference(option)}
            className={cn(
              'flex h-8 w-8 items-center justify-center transition-colors duration-150',
              'hover:bg-app-hover',
              active
                ? 'bg-app-selected-bg text-app-selected-text'
                : 'text-app-subtle hover:text-app-text',
            )}
          >
            <Icon />
            <span className="sr-only">{THEME_LABELS[option]}</span>
          </button>
        );
      })}
    </div>
  );
}
