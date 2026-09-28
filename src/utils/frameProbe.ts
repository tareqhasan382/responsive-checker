/**
 * Best-effort preflight probe for whether a target can be framed.
 *
 * There is a hard browser limit worth being precise about: a parent page
 * cannot introspect a cross-origin frame to discover that the browser refused
 * to render it. Chrome, Firefox and Safari all fire the iframe `load` event
 * for a blocked frame exactly as they do for a working one, and every read of
 * `contentWindow` throws `SecurityError` in both cases. So the app cannot tell
 * "rendered fine" apart from "silently blanked by the browser" — which is why
 * `ViewportFrame` must not treat `load` as proof of success.
 *
 * What this probe *can* do is ask the server directly, but only within a
 * narrow window. A CORS request that succeeds exposes just the safelisted
 * response headers plus whatever `Access-Control-Expose-Headers` allows, and
 * `X-Frame-Options` and `Content-Security-Policy` are not safelisted. So a
 * `null` header here does not mean the header is absent — verified against
 * `fonts.googleapis.com`, which serves `X-Frame-Options: SAMEORIGIN` yet reads
 * back as `null` in the browser. Reporting that as "no restriction" would be
 * a false negative, so `hidden` is kept distinct from `confirmed`.
 */

export type FrameProbe =
  | {
      /**
       * The response was readable *and* exposed at least one framing header,
       * so the verdict is trustworthy.
       */
      readonly kind: 'confirmed';
      readonly status: number;
      readonly host: string;
      readonly xFrameOptions: string | null;
      readonly csp: string | null;
    }
  | {
      /**
       * The site answered, but hid its framing headers. The status still tells
       * us something useful — 401 or 403 means a login wall, not framing.
       */
      readonly kind: 'hidden';
      readonly status: number;
      readonly host: string;
    }
  | {
      /**
       * The browser withheld the response entirely. `fetch` raises the same
       * `TypeError` for a missing `Access-Control-Allow-Origin` as it does for
       * a DNS or TLS failure, so this deliberately does not claim which
       * happened. Not a failure signal.
       */
      readonly kind: 'unreadable';
    };

/** Pulls the `frame-ancestors` source list out of a CSP header value. */
function parseFrameAncestors(csp: string | null): string | null {
  if (csp === null) return null;
  const sources = /(?:^|;)\s*frame-ancestors\s+([^;]+)/i.exec(csp)?.[1];
  return sources === undefined ? null : sources.trim();
}

function hostOf(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

export async function probeFraming(url: string): Promise<FrameProbe> {
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      mode: 'cors',
      redirect: 'follow',
      cache: 'no-store',
    });

    if (response.type === 'opaque') return { kind: 'unreadable' };

    const status = response.status;
    const host = hostOf(response.url || url);
    const rawCsp = response.headers.get('content-security-policy');
    const ancestors = parseFrameAncestors(rawCsp);
    const xFrameOptions = response.headers.get('x-frame-options');

    if (xFrameOptions === null && ancestors === null) {
      return { kind: 'hidden', status, host };
    }

    return {
      kind: 'confirmed',
      status,
      host,
      xFrameOptions,
      csp: ancestors === null ? null : `frame-ancestors ${ancestors}`,
    };
  } catch {
    return { kind: 'unreadable' };
  }
}

/**
 * `X-Frame-Options` has no wildcard form, so any value it carries blocks a
 * cross-origin parent. For CSP, only the ancestor list matters.
 */
export function blocksFraming(
  probe: Extract<FrameProbe, { kind: 'confirmed' }>,
): boolean {
  if (probe.xFrameOptions !== null) return true;
  return probe.csp !== null && !probe.csp.includes('*');
}
