import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

/**
 * Guards the embed proxy against server-side request forgery.
 *
 * Without this, the proxy would let anyone use the deployment to reach hosts
 * that are only reachable from the server: cloud metadata endpoints, private
 * VPC ranges, and anything listening on localhost. Requests are validated
 * before the fetch and again after redirects, since a public host can bounce
 * us to an internal address.
 *
 * Residual risk worth naming: the hostname is resolved here and then resolved
 * again by `fetch`, so a DNS record that changes between the two lookups could
 * win the race. Closing that fully would mean pinning the socket to the IP we
 * validated, which `fetch` does not expose. The check still removes the
 * ordinary "pass a private address in a query string" case, and the proxy is
 * opt-in rather than the default path.
 */

const BLOCKED_V4: readonly [string, number][] = [
  ['0.0.0.0', 8],
  ['10.0.0.0', 8],
  ['100.64.0.0', 10],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16],
  ['172.16.0.0', 12],
  ['192.0.0.0', 24],
  ['192.0.2.0', 24],
  ['192.88.99.0', 24],
  ['192.168.0.0', 16],
  ['198.18.0.0', 15],
  ['198.51.100.0', 24],
  ['203.0.113.0', 24],
  ['224.0.0.0', 4],
  ['240.0.0.0', 4],
];

function toV4Number(address: string): number {
  return address
    .split('.')
    .reduce((total, part) => total * 256 + Number(part), 0) >>> 0;
}

function inV4Range(address: string): boolean {
  const value = toV4Number(address);
  return BLOCKED_V4.some(([network, bits]) => {
    const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
    return (value & mask) === (toV4Number(network) & mask);
  });
}

/** Expands an IPv6 literal to its eight 16-bit groups. */
function v6Groups(address: string): number[] | null {
  let text = address;
  if (text.startsWith('[') && text.endsWith(']')) text = text.slice(1, -1);
  const zone = text.indexOf('%');
  if (zone !== -1) text = text.slice(0, zone);

  const halves = text.split('::');
  if (halves.length > 2) return null;

  const first = halves[0] ?? '';
  const second = halves[1] ?? '';
  const head = first === '' ? [] : first.split(':');
  const tail = halves.length === 2 ? (second === '' ? [] : second.split(':')) : [];
  const fill = 8 - head.length - tail.length;
  if (fill < 0 || (halves.length === 1 && fill !== 0)) return null;

  const parts = [...head, ...Array<string>(fill).fill('0'), ...tail];
  if (parts.length !== 8) return null;

  const groups: number[] = [];
  for (const part of parts) {
    if (!/^[0-9a-fA-F]{1,4}$/.test(part)) return null;
    groups.push(parseInt(part, 16));
  }
  return groups;
}

export function isPrivateAddress(address: string): boolean {
  const literal = isIP(address);
  if (literal === 4) return inV4Range(address);

  const groups = v6Groups(address);
  if (groups === null) return true; // unparseable: refuse rather than guess

  const g0 = groups[0] ?? 0;
  const g1 = groups[1] ?? 0;
  const g5 = groups[5] ?? 0;
  const g6 = groups[6] ?? 0;
  const g7 = groups[7] ?? 0;

  // IPv4-mapped and NAT64 addresses smuggle a v4 target through a v6 literal.
  const embeddedV4 =
    g0 === 0 && g1 === 0 && ((g6 === 0 && (g7 >> 8) === 0xffff) || g5 === 0xffff);
  if (embeddedV4) {
    const dotted = `${g6 >> 8}.${g6 & 0xff}.${g7 >> 8}.${g7 & 0xff}`;
    return inV4Range(dotted);
  }

  if (groups.every((group) => group === 0)) return true; // :: unspecified
  if (groups.slice(0, 7).every((group) => group === 0) && g7 === 1) {
    return true; // ::1 loopback
  }
  if ((g0 & 0xfe00) === 0xfc00) return true; // fc00::/7 unique local
  if ((g0 & 0xffc0) === 0xfe80) return true; // fe80::/10 link local
  if ((g0 & 0xff00) === 0xff00) return true; // ff00::/8 multicast
  return false;
}

export type UrlVerdict = { readonly ok: true } | { readonly ok: false; readonly reason: string };

export async function assertPublicHttpUrl(url: URL): Promise<UrlVerdict> {
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return { ok: false, reason: 'Only http and https URLs can be embedded.' };
  }

  const host = url.hostname.replace(/^\[|\]$/g, '');

  if (isIP(host) !== 0) {
    return isPrivateAddress(host)
      ? { ok: false, reason: 'That address is on a private or local network.' }
      : { ok: true };
  }

  if (host === 'localhost' || host.endsWith('.localhost')) {
    return {
      ok: false,
      reason:
        'localhost cannot be reached through the proxy. Open it directly — local dev servers rarely block framing.',
    };
  }

  let addresses: readonly { address: string }[];
  try {
    addresses = await lookup(host, { all: true });
  } catch {
    return { ok: false, reason: 'That hostname could not be resolved.' };
  }

  if (addresses.length === 0) {
    return { ok: false, reason: 'That hostname resolved to no addresses.' };
  }

  const blocked = addresses.find((entry) => isPrivateAddress(entry.address));
  return blocked === undefined
    ? { ok: true }
    : {
        ok: false,
        reason: 'That hostname resolves to a private or local address.',
      };
}
