import type { TargetUrl, UrlValidationResult } from '@/types/app';
import { ALLOWED_PROTOCOLS } from './constants';

const SCHEME_WITH_AUTHORITY = /^[a-z][a-z\d+\-.]*:\/\//i;
const HOSTNAME = /^(localhost|127\.0\.0\.1|\[::1\]|0\.0\.0\.0)$/i;
const PRIVATE_IPV4 =
  /^(10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})$/;

/** Spaces and percent-encoding never belong in a hostname. */
const INVALID_HOST_CHARACTERS = /[\s%]/;

function getAuthority(value: string): string {
  const withoutScheme = value
    .replace(SCHEME_WITH_AUTHORITY, '')
    .replace(/^\/\//, '');
  const boundary = withoutScheme.search(/[/?#\\]/);
  const authority =
    boundary === -1 ? withoutScheme : withoutScheme.slice(0, boundary);
  return authority.replace(/^@/, '');
}

function isLocalAuthority(authority: string): boolean {
  const hostname = authority.replace(/:\d*$/, '').replace(/^\[|\]$/g, '');
  return (
    HOSTNAME.test(hostname) ||
    PRIVATE_IPV4.test(hostname) ||
    hostname.endsWith('.local')
  );
}

/**
 * Turns user input into a loadable absolute URL.
 * - `example.com`            -> `https://example.com/`
 * - `localhost:3000/admin`   -> `http://localhost:3000/admin`
 * - `127.0.0.1:5173`         -> `http://127.0.0.1:5173/`
 * - `https://a.dev/x?y=1`    -> unchanged
 */
export function normalizeUrl(raw: string): string {
  const value = raw.trim();
  if (value.length === 0) return '';

  if (SCHEME_WITH_AUTHORITY.test(value)) return value;
  if (value.startsWith('//')) return `https:${value}`;

  const scheme = isLocalAuthority(getAuthority(value)) ? 'http' : 'https';
  return `${scheme}://${value}`;
}

export function validateUrl(raw: string): UrlValidationResult {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return { ok: false, error: 'Enter a URL to test.' };
  }

  const authority = getAuthority(trimmed);
  if (authority.length === 0) {
    return { ok: false, error: 'The URL is missing a hostname.' };
  }

  if (INVALID_HOST_CHARACTERS.test(authority)) {
    return {
      ok: false,
      error: `"${trimmed}" is not a valid URL — check for spaces or typos.`,
    };
  }

  const candidate = normalizeUrl(trimmed);

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    return { ok: false, error: `"${trimmed}" is not a valid URL.` };
  }

  if (
    !ALLOWED_PROTOCOLS.includes(
      parsed.protocol as (typeof ALLOWED_PROTOCOLS)[number],
    )
  ) {
    const allowed = ALLOWED_PROTOCOLS.map((protocol) =>
      protocol.replace(':', ''),
    ).join(' or ');
    return { ok: false, error: `Only ${allowed} URLs can be loaded.` };
  }

  if (parsed.hostname.length === 0) {
    return { ok: false, error: 'The URL is missing a hostname.' };
  }

  return { ok: true, url: parsed.toString() };
}

export function toTargetUrl(value: string): TargetUrl | null {
  const result = validateUrl(value);
  if (!result.ok) return null;

  try {
    const parsed = new URL(result.url);
    return { value: parsed.toString(), hostname: parsed.host };
  } catch {
    return null;
  }
}

/** `https://example.com/` -> `https://example.com` (used for compact chips). */
export function formatUrlForDisplay(value: string): string {
  try {
    const parsed = new URL(value);
    const path = parsed.pathname === '/' ? '' : parsed.pathname;
    return `${parsed.protocol}//${parsed.host}${path}${parsed.search}`;
  } catch {
    return value;
  }
}

export function isLocalTarget(value: string): boolean {
  try {
    return isLocalAuthority(new URL(value).hostname);
  } catch {
    return false;
  }
}

/** Reads the initial target from `?url=` so a view can be shared as a link. */
export function readTargetFromQuery(search: string): string | null {
  const fromQuery = new URLSearchParams(search).get('url');
  if (fromQuery === null || fromQuery.trim().length === 0) return null;

  const result = validateUrl(fromQuery);
  return result.ok ? result.url : null;
}
