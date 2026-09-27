import { GitHubIcon } from '@/components/ui/icons';
import {
  AUTHOR_GITHUB_HANDLE,
  AUTHOR_GITHUB_URL,
  AUTHOR_NAME,
} from '@/config/site';

export interface SidebarAuthorCardProps {
  /** Renders only the avatar; used when the sidebar is collapsed to the rail. */
  readonly collapsed?: boolean;
}

/** Initials for the avatar badge, derived from the author name. */
function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0] ?? '';
  if (parts.length < 2) return first.slice(0, 2).toUpperCase();
  const last = parts[parts.length - 1] ?? '';
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

const AVATAR_CLASSES =
  'text-app-accent-contrast flex size-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold tracking-tight';

/**
 * Sidebar footer crediting the author, doubling as the link to their GitHub.
 * Rendered as one anchor so the whole row is a single, honest hit target.
 */
export function SidebarAuthorCard({
  collapsed = false,
}: SidebarAuthorCardProps) {
  const avatar = (
    <span
      className={AVATAR_CLASSES}
      style={{
        backgroundImage:
          'linear-gradient(135deg, var(--app-accent), var(--app-accent-strong))',
      }}
    >
      {initialsOf(AUTHOR_NAME)}
    </span>
  );

  if (collapsed) {
    return (
      <a
        href={AUTHOR_GITHUB_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${AUTHOR_NAME} on GitHub`}
        title={`${AUTHOR_NAME} · @${AUTHOR_GITHUB_HANDLE}`}
        className="group flex items-center justify-center rounded-md transition-opacity duration-150 hover:opacity-85"
      >
        {avatar}
      </a>
    );
  }

  return (
    <footer className="border-app-border bg-app-panel/60 shrink-0 border-t p-2">
      <a
        href={AUTHOR_GITHUB_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="group border-app-border bg-app-elevated hover:border-app-accent/50 hover:bg-app-hover flex items-center gap-2 rounded-lg border p-1.5 transition-colors duration-150"
      >
        {avatar}

        <span className="flex min-w-0 flex-1 flex-col">
          <span className="text-app-text truncate text-[11.5px] leading-tight font-semibold tracking-tight">
            {AUTHOR_NAME}
          </span>
          <span className="text-app-subtle group-hover:text-app-muted truncate font-mono text-[10px] leading-tight transition-colors">
            @{AUTHOR_GITHUB_HANDLE}
          </span>
        </span>

        <GitHubIcon className="text-app-subtle group-hover:text-app-accent shrink-0 text-[13px] transition-colors duration-150" />
      </a>
    </footer>
  );
}
