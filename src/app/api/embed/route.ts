import { assertPublicHttpUrl } from '@/utils/ssrf';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Embed proxy.
 *
 * Browsers refuse to frame a document whose response carries
 * `X-Frame-Options` or a `frame-ancestors` CSP rule, and no client-side code can
 * override that. This route is the only way to preview such a site: it fetches
 * the document server-side, drops the headers that cause the refusal, and
 * injects a `<base href>` so the page's own assets still resolve against the
 * original origin rather than this one.
 *
 * What this cannot fix, because it is not a header problem: sites that need
 * same-origin APIs behind their own login, sites behind third-party cookie
 * walls, and client-side routers that assume their own origin. Those need a
 * full asset-rewriting proxy, which is a much larger and more dangerous thing
 * to operate.
 */

/** Headers that either block framing or break the injected document. */
const STRIPPED_RESPONSE_HEADERS = [
  'x-frame-options',
  'content-security-policy',
  'content-security-policy-report-only',
  'cross-origin-embedder-policy',
  'cross-origin-opener-policy',
  'cross-origin-resource-policy',
  'x-content-type-options',
  'report-to',
  'nel',
];

const UA =
  'Mozilla/5.0 (compatible; ResponsiveCheckerEmbed/1.0; +https://responsive-checker-test.vercel.app)';

const PROXY_PATH = '/api/embed?url=';

/**
 * Keeps the framed document on the proxy.
 *
 * The proxied page is served from this origin at a path that is not its real
 * one, so any client-side router that normalises its own URL on boot resolves
 * the current path against the injected `<base>` and navigates straight off the
 * proxy — landing on a 404 on the real site. Measured on nextjs.org and
 * vercel.com, both Next.js apps, which both ejected within seconds of loading.
 *
 * So every navigation is turned back into a proxy request: history entries,
 * `location.assign`/`replace`, and link clicks. The document therefore stays
 * framed and in-frame navigation keeps working, which is the behaviour a
 * preview tool needs.
 */
const NAVIGATION_GUARD = `<script>(function(){
var P=${JSON.stringify(PROXY_PATH)};
function already(a){return a.indexOf(location.origin+P)===0;}
function abs(u){try{return new URL(u,document.baseURI).href;}catch(e){return null;}}
function rehome(u){
  var a=abs(u);
  if(!a||already(a))return false;
  location.replace(P+encodeURIComponent(a));
  return true;
}
['pushState','replaceState'].forEach(function(k){
  var o=history[k];
  history[k]=function(s,t,h){
    if(typeof h==='string'&&rehome(h))return;
    return o.call(history,s,t,h);
  };
});
['assign','replace'].forEach(function(k){
  try{
    var o=location[k];
    Object.defineProperty(location,k,{configurable:true,value:function(u){
      if(!rehome(u))o.call(location,u);
    }});
  }catch(e){}
});
document.addEventListener('click',function(e){
  var a=e.target&&e.target.closest?e.target.closest('a[href]'):null;
  if(!a||a.target||a.hasAttribute('download'))return;
  if(rehome(a.getAttribute('href')))e.preventDefault();
},true);
})();</script>`;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function decodeBody(buffer: ArrayBuffer, contentType: string | null): string {
  const charset = /charset=["']?([\w-]+)/i.exec(contentType ?? '')?.[1];
  try {
    return new TextDecoder(charset ?? 'utf-8').decode(buffer);
  } catch {
    return new TextDecoder('utf-8').decode(buffer);
  }
}

function errorPage(title: string, detail: string): Response {
  return new Response(
    `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>
  :root { color-scheme: light dark; }
  body { margin:0; min-height:100vh; display:grid; place-items:center; padding:2rem;
         font:15px/1.6 ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,sans-serif; }
  .box { max-width:34rem; }
  h1 { font-size:1.05rem; margin:0 0 .5rem; }
  p { margin:0; opacity:.75; }
  code { font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-size:.85em; }
</style></head>
<body><div class="box"><h1>${escapeHtml(title)}</h1><p>${escapeHtml(detail)}</p></div></body></html>`,
    {
      status: 200,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'no-store',
      },
    },
  );
}

/**
 * Rewrites the document for a foreign origin. The `<base>` tag does the heavy
 * lifting: with it in place, every relative `src`/`href` resolves against the
 * original site, so styles, scripts and images load straight from the target
 * and never become CORS failures.
 */
function rewriteDocument(html: string, origin: string): string {
  const baseTag = `<base href="${escapeHtml(origin)}">`;

  // A meta CSP from the target would now apply to *our* origin and block the
  // assets that the base tag just redirected, so it has to go.
  const stripped = html.replace(
    /<meta[^>]+http-equiv=["']?content-security-policy["']?[^>]*>/gi,
    '',
  );

  // Deliberately no rewrite of relative URLs: the base tag already resolves
  // them against the target, and the guard below re-proxies any navigation the
  // document attempts so the frame cannot eject itself.
  const head = baseTag + NAVIGATION_GUARD;

  if (/<head[^>]*>/i.test(stripped)) {
    return stripped.replace(/<head[^>]*>/i, (match) => match + head);
  }
  if (/<html[^>]*>/i.test(stripped)) {
    return stripped.replace(/<html[^>]*>/i, (match) => `${match}<head>${head}</head>`);
  }
  return `<!doctype html><html><head>${head}</head><body>${stripped}</body></html>`;
}

export async function GET(request: Request): Promise<Response> {
  const raw = new URL(request.url).searchParams.get('url');

  if (raw === null || raw.trim() === '') {
    return errorPage('Nothing to embed', 'No url parameter was provided.');
  }

  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return errorPage('That URL is not valid', `Could not parse ${raw}.`);
  }

  const verdict = await assertPublicHttpUrl(target);
  if (!verdict.ok) {
    return errorPage('This URL cannot be proxied', verdict.reason);
  }

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      redirect: 'follow',
      cache: 'no-store',
      headers: {
        'user-agent': UA,
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'accept-language': 'en-US,en;q=0.9',
      },
    });
  } catch {
    return errorPage(
      'The site did not respond',
      `${target.host} could not be reached from the proxy.`,
    );
  }

  // A public host can still redirect us somewhere internal, so re-check.
  let finalUrl: URL;
  try {
    finalUrl = new URL(upstream.url || target.href);
  } catch {
    return errorPage('Bad redirect', 'The site redirected to an unusable address.');
  }
  const finalVerdict = await assertPublicHttpUrl(finalUrl);
  if (!finalVerdict.ok) {
    return errorPage('Blocked redirect', finalVerdict.reason);
  }

  if (upstream.status >= 400) {
    return errorPage(
      `The site returned ${upstream.status}`,
      upstream.status === 401 || upstream.status === 403
        ? 'This looks like a login wall or a protected preview. It cannot be rendered in a frame, proxy or not.'
        : 'There is nothing to display for this response.',
    );
  }

  const contentType = upstream.headers.get('content-type');
  if (contentType === null || !contentType.includes('text/html')) {
    return errorPage(
      'Not a web page',
      'Force embed only works for HTML documents, and this URL served ' +
        (contentType ?? 'an unknown content type') +
        '.',
    );
  }

  const html = decodeBody(await upstream.arrayBuffer(), contentType);
  const origin = `${finalUrl.origin}/`;

  const headers = new Headers();
  for (const [key, value] of upstream.headers) {
    if (!STRIPPED_RESPONSE_HEADERS.includes(key.toLowerCase())) {
      headers.set(key, value);
    }
  }
  headers.set('content-type', 'text/html; charset=utf-8');
  headers.set('cache-control', 'no-store');
  headers.set('referrer-policy', 'no-referrer');
  headers.delete('content-encoding');
  headers.delete('content-length');

  return new Response(rewriteDocument(html, origin), { status: 200, headers });
}
