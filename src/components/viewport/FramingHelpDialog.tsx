'use client';

import { useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { AlertIcon, CheckIcon, ExternalLinkIcon } from '@/components/ui/icons';
import { cn } from '@/lib/cn';
import { blocksFraming, probeFraming } from '@/utils/frameProbe';
import type { FrameProbe } from '@/utils/frameProbe';

/**
 * Where the tester can be framed from. Kept in sync with the live deployment
 * and the local dev server so a copied snippet works in both places.
 */
const FRAME_ANCESTORS =
  "'self' https://responsive-checker-test.vercel.app http://localhost:3000";

interface Recipe {
  readonly id: string;
  readonly label: string;
  readonly language: string;
  readonly code: string;
}

const RECIPES: readonly [Recipe, ...Recipe[]] = [
  {
    id: 'next',
    label: 'Next.js',
    language: 'next.config.ts',
    code: `// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Overrides any X-Frame-Options another layer added.
          { key: 'X-Frame-Options', value: 'ALLOWALL' },
          {
            key: 'Content-Security-Policy',
            value: \`frame-ancestors \${FRAME_ANCESTORS}\`,
          },
        ],
      },
    ];
  },
};

export default nextConfig;`,
  },
  {
    id: 'vercel',
    label: 'Vercel',
    language: 'vercel.json',
    code: `{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options", "value": "ALLOWALL" },
        {
          "key": "Content-Security-Policy",
          "value": "frame-ancestors ${FRAME_ANCESTORS}"
        }
      ]
    }
  ]
}`,
  },
  {
    id: 'nuxt',
    label: 'Nuxt',
    language: 'server/middleware/frame.ts',
    code: `// Nitro sets X-Frame-Options on its own, so override it.
export default defineEventHandler((event) => {
  setHeader(event, 'X-Frame-Options', 'ALLOWALL')
  setHeader(event, 'Content-Security-Policy', 'frame-ancestors ${FRAME_ANCESTORS}')
})`,
  },
  {
    id: 'netlify',
    label: 'Netlify / Cloudflare',
    language: 'public/_headers',
    code: `/*
  X-Frame-Options: ALLOWALL
  Content-Security-Policy: frame-ancestors ${FRAME_ANCESTORS}`,
  },
  {
    id: 'express',
    label: 'Express',
    language: 'server.js',
    code: `// helmet blocks framing by default.
app.use(
  helmet({
    frameguard: false,
    contentSecurityPolicy: {
      directives: {
        'frame-ancestors': ["'self'", 'https://responsive-checker-test.vercel.app'],
      },
    },
  }),
);`,
  },
  {
    id: 'nginx',
    label: 'Nginx',
    language: 'nginx.conf',
    code: `add_header X-Frame-Options "ALLOWALL" always;
add_header Content-Security-Policy "frame-ancestors ${FRAME_ANCESTORS}" always;`,
  },
];

export interface FramingHelpDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly target: string | null;
}

export function FramingHelpDialog({
  open,
  onClose,
  target,
}: FramingHelpDialogProps) {
  const [probe, setProbe] = useState<FrameProbe | null>(null);
  const [pending, setPending] = useState(false);
  const [recipeId, setRecipeId] = useState(RECIPES[0].id);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open || target === null) {
      setProbe(null);
      return;
    }
    let active = true;
    setPending(true);
    setProbe(null);
    setCopied(false);
    probeFraming(target).then((result) => {
      if (!active) return;
      setProbe(result);
      setPending(false);
    });
    return () => {
      active = false;
    };
  }, [open, target]);

  const recipe = RECIPES.find((item) => item.id === recipeId) ?? RECIPES[0];

  const handleCopy = useCallback(() => {
    void navigator.clipboard.writeText(recipe.code).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    });
  }, [recipe.code]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      className="w-[min(38rem,calc(100vw-2rem))]"
      title="Frame not showing?"
      description="Most blank previews are not a bug in this tool."
      footer={
        target !== null ? (
          <Button
            size="sm"
            variant="outline"
            icon={<ExternalLinkIcon />}
            onClick={() =>
              window.open(target, '_blank', 'noopener,noreferrer')
            }
          >
            Open {shortHost(target)} in a tab
          </Button>
        ) : null
      }
    >
      <div className="space-y-4 text-xs">
        <p className="text-app-muted leading-relaxed">
          A browser will not render a site inside a frame when that site opts
          out with <code className="text-app-text">X-Frame-Options</code> or a{' '}
          <code className="text-app-text">frame-ancestors</code> CSP rule. The
          browser enforces this before any page loads, and the frame stays
          blank. No tool can override it, and this page cannot detect it
          either — a blocked frame fires its{' '}
          <code className="text-app-text">load</code> event and reports itself
          as healthy, exactly like a working one.
        </p>

        <ProbeResult probe={probe} pending={pending} />

        <section>
          <h3 className="text-app-text font-semibold">
            If the site is yours, unblock it
          </h3>
          <p className="text-app-muted mt-1 leading-relaxed">
            Add one of these to the site you are testing, then redeploy. Frame
            headers come from the site, not from this tester.
          </p>
        </section>

        <div
          role="tablist"
          aria-label="Platform"
          className="flex flex-wrap gap-1"
        >
          {RECIPES.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={item.id === recipe.id}
              onClick={() => {
                setRecipeId(item.id);
                setCopied(false);
              }}
              className={cn(
                'border-app-border rounded-md border px-2 py-1 text-[11px] font-medium transition-colors',
                item.id === recipe.id
                  ? 'border-app-border-strong bg-app-elevated text-app-text'
                  : 'text-app-muted hover:bg-app-hover hover:text-app-text',
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="border-app-border bg-app-canvas/40 overflow-hidden rounded-md border">
          <div className="border-app-border text-app-subtle flex items-center justify-between border-b px-2.5 py-1.5 font-mono text-[10px]">
            {recipe.language}
            <Button
              size="sm"
              variant="ghost"
              icon={copied ? <CheckIcon /> : undefined}
              onClick={handleCopy}
            >
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>
          <pre className="scrollbar-slim max-h-56 overflow-auto p-2.5 text-[11px] leading-relaxed">
            <code>{recipe.code}</code>
          </pre>
        </div>

        <div className="border-app-border bg-app-warning/5 flex gap-2 rounded-md border p-2.5">
          <AlertIcon className="text-app-warning mt-0.5 size-3.5 shrink-0" />
          <p className="text-app-muted leading-relaxed">
            On Vercel, also check that{' '}
            <strong className="text-app-text">Deployment Protection</strong> is
            off. A protected preview answers with a login page that no frame
            can display.
          </p>
        </div>
      </div>
    </Dialog>
  );
}

function ProbeResult({
  probe,
  pending,
}: {
  readonly probe: FrameProbe | null;
  readonly pending: boolean;
}) {
  if (pending) {
    return (
      <p
        role="status"
        className="text-app-muted flex items-center gap-2 leading-relaxed"
      >
        <span className="border-app-border border-t-app-accent size-3.5 animate-spin rounded-full border-2" />
        Asking the server for its framing headers…
      </p>
    );
  }

  if (probe === null) return null;

  if (probe.kind === 'unreadable') {
    return (
      <p className="text-app-muted leading-relaxed">
        The site did not let this page read its response, so the check is
        inconclusive. Open it in a tab — if it works there but the frame is
        blank, a framing header is the cause.
      </p>
    );
  }

  if (probe.kind === 'hidden') {
    return (
      <div className="border-app-border bg-app-canvas/40 rounded-md border p-2.5">
        <p className="text-app-muted leading-relaxed">
          The site answered{' '}
          <span className="text-app-text font-mono">{probe.status}</span> from{' '}
          <span className="text-app-text">{probe.host}</span>, but hid its
          framing headers.
        </p>
        {probe.status === 401 || probe.status === 403 ? (
          <p className="text-app-warning mt-2 leading-relaxed">
            This is an authentication wall, not framing. A protected preview
            cannot render in any frame.
          </p>
        ) : null}
        <p className="text-app-muted mt-2 leading-relaxed">
          Browsers do not expose <code className="text-app-text">X-Frame-Options</code>{' '}
          or <code className="text-app-text">Content-Security-Policy</code> to
          other sites, so a successful request still proves nothing. The header
          may well be set and simply invisible from here.
        </p>
      </div>
    );
  }

  const blocked = blocksFraming(probe);

  return (
    <div className="border-app-border bg-app-canvas/40 rounded-md border p-2.5">
      <p className="text-app-muted leading-relaxed">
        <span className="text-app-text font-mono">{probe.status}</span> from{' '}
        <span className="text-app-text">{probe.host}</span>.
      </p>
      <dl className="mt-1.5 grid grid-cols-[auto,1fr] gap-x-2 gap-y-1">
        <dt className="text-app-subtle font-mono text-[10.5px]">
          X-Frame-Options
        </dt>
        <dd className="text-app-text font-mono text-[10.5px] break-all">
          {probe.xFrameOptions ?? 'not set'}
        </dd>
        <dt className="text-app-subtle font-mono text-[10.5px]">CSP</dt>
        <dd className="text-app-text font-mono text-[10.5px] break-all">
          {probe.csp ?? 'no frame-ancestors'}
        </dd>
      </dl>
      {blocked ? (
        <p className="text-app-warning mt-2 leading-relaxed">
          This response asks browsers to refuse framing, which is the reason
          the preview is blank.
        </p>
      ) : (
        <p className="text-app-muted mt-2 leading-relaxed">
          No framing restriction found, so the site should embed. A blank frame
          then points at something else, such as a client-side error.
        </p>
      )}
    </div>
  );
}

function shortHost(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}
