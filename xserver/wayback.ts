import { getBridgeScript } from './sites.ts';

export interface WaybackLookupResult {
  found: boolean;
  reason: '2006' | 'earliest-historical' | 'brand-new-2025-plus' | 'error';
  timestamp?: string;
  year?: string;
  formattedDate?: string;
  archivedOriginalUrl?: string;
  earliestAvailableYear?: string;
  errorMessage?: string;
}

interface CdxRow {
  timestamp: string;
  original: string;
  statuscode: string;
  length: string;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function formatWaybackDate(ts: string): string {
  if (ts.length < 8) return ts;
  return `${ts.slice(0, 4)}-${ts.slice(4, 6)}-${ts.slice(6, 8)}`;
}

function toCdxQueryUrl(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl);
    const pathPart = parsed.pathname && parsed.pathname !== '/' ? parsed.pathname : '/';
    return `${parsed.hostname}${pathPart}${parsed.search}`;
  } catch {
    return rawUrl.replace(/^https?:\/\//i, '');
  }
}

async function queryCdx(params: Record<string, string>, timeoutMs = 5500): Promise<CdxRow[]> {
  const qs = new URLSearchParams({
    output: 'json',
    filter: 'statuscode:200',
    collapse: 'timestamp:6',
    ...params,
  });

  // Append second filter for text/html separately since URLSearchParams overwrites duplicate keys
  const url = `https://web.archive.org/cdx/search/cdx?${qs.toString()}&filter=mimetype:text/html`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/4.72 [en] (Xserver/1.99 WaybackClient)',
        Accept: 'application/json',
      },
    });
    if (!res.ok) {
      throw new Error(`Wayback CDX HTTP ${res.status}`);
    }
    const rows = (await res.json()) as string[][];
    if (!Array.isArray(rows) || rows.length <= 1) return [];

    const headers = rows[0];
    const tsIdx = headers.indexOf('timestamp');
    const origIdx = headers.indexOf('original');
    const statusIdx = headers.indexOf('statuscode');
    const lenIdx = headers.indexOf('length');

    return rows.slice(1).map((r) => ({
      timestamp: r[tsIdx] || '',
      original: r[origIdx] || '',
      statuscode: r[statusIdx] || '',
      length: r[lenIdx] || '0',
    }));
  } finally {
    clearTimeout(timer);
  }
}

export async function lookupWaybackSnapshot(targetUrl: string): Promise<WaybackLookupResult> {
  const cdxUrl = toCdxQueryUrl(targetUrl);

  try {
    // 1. Prefer 2006 snapshot (ideal classic target)
    const rows2006 = await queryCdx({
      url: cdxUrl,
      from: '20060101',
      to: '20061231',
      limit: '8',
    });

    if (rows2006.length > 0) {
      // Prefer a mid-year 2006 snapshot with non-trivial HTML length if available
      const viable = rows2006.filter((r) => Number(r.length || 0) > 400);
      const chosen = viable[Math.floor(viable.length / 2)] || rows2006[0];
      return {
        found: true,
        reason: '2006',
        timestamp: chosen.timestamp,
        year: chosen.timestamp.slice(0, 4),
        formattedDate: formatWaybackDate(chosen.timestamp),
        archivedOriginalUrl: chosen.original,
      };
    }

    // 2. If no 2006 snapshot exists, check if the site existed before 2025 (e.g., created in 2007+)
    const rowsHistorical = await queryCdx({
      url: cdxUrl,
      from: '19960101',
      to: '20241231',
      limit: '5',
    });

    if (rowsHistorical.length > 0) {
      const viable = rowsHistorical.filter((r) => Number(r.length || 0) > 400);
      const chosen = viable[0] || rowsHistorical[0];
      return {
        found: true,
        reason: 'earliest-historical',
        timestamp: chosen.timestamp,
        year: chosen.timestamp.slice(0, 4),
        formattedDate: formatWaybackDate(chosen.timestamp),
        archivedOriginalUrl: chosen.original,
      };
    }

    // 3. No pre-2025 snapshot exists -> site is brand new (2025/2026) -> stay live without Wayback!
    return {
      found: false,
      reason: 'brand-new-2025-plus',
    };
  } catch (err) {
    return {
      found: false,
      reason: 'error',
      errorMessage: err instanceof Error ? err.message : 'Wayback CDX lookup failed',
    };
  }
}

export async function fetchWaybackHtml(timestamp: string, originalUrl: string): Promise<{
  html: string;
  status: number;
  statusText: string;
}> {
  const waybackUrl = `https://web.archive.org/web/${timestamp}id_/${originalUrl}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8500);
  try {
    const res = await fetch(waybackUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/4.72 [en] (Xserver/1.99 WaybackClient)',
        Accept: 'text/html,application/xhtml+xml,*/*',
      },
    });
    const html = await res.text();
    return {
      html,
      status: res.status,
      statusText: res.statusText || 'OK',
    };
  } finally {
    clearTimeout(timer);
  }
}

export function adaptWaybackHtmlForNavigator(opts: {
  rawHtml: string;
  originalUrl: string;
  displayUrl: string;
  timestamp: string;
  reason: '2006' | 'earliest-historical';
  isYouTubeRoot?: boolean;
}): string {
  const { rawHtml, originalUrl, displayUrl, timestamp, reason, isYouTubeRoot } = opts;
  const year = timestamp.slice(0, 4);
  const formattedDate = formatWaybackDate(timestamp);

  // Strip scripts, iframes, objects, and inline on* handlers for safe 1999 rendering
  let cleaned = rawHtml
    .replace(/<!-- BEGIN WAYBACK TOOLBAR INSERT -->[\s\S]*?<!-- END WAYBACK TOOLBAR INSERT -->/gi, '')
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');

  // Strip any pre-rewritten web.archive.org/web/... prefixes in hrefs so links resolve cleanly
  cleaned = cleaned.replace(
    /https?:\/\/web\.archive\.org\/web\/\d+[a-z_]*\/(https?:\/\/[^"'\s>]+)/gi,
    '$1'
  );

  // Rewrite <a href> and <form action> to absolute original URLs so clicks browse via Xserver Wayback
  cleaned = cleaned.replace(
    /(<(?:a|area|form)\b[^>]*?\s(?:href|action)\s*=\s*)(["'])([^"']+)\2/gi,
    (match, prefix, quote, val) => {
      if (
        val.startsWith('#') ||
        val.startsWith('mailto:') ||
        val.startsWith('javascript:')
      ) {
        return match;
      }
      try {
        const abs = new URL(val, originalUrl).toString();
        return `${prefix}${quote}${abs}${quote}`;
      } catch {
        return match;
      }
    }
  );

  // Rewrite stylesheets to Wayback cs_ snapshots
  cleaned = cleaned.replace(
    /(<link\b[^>]*?href\s*=\s*)(["'])([^"']+)\2/gi,
    (match, prefix, quote, val) => {
      if (val.startsWith('data:')) return match;
      try {
        const abs = new URL(val, originalUrl).toString();
        return `${prefix}${quote}https://web.archive.org/web/${timestamp}cs_/${abs}${quote}`;
      } catch {
        return match;
      }
    }
  );

  // Rewrite images and background attributes to Wayback im_ snapshots
  cleaned = cleaned.replace(
    /(\s(?:src|background)\s*=\s*)(["'])([^"']+)\2/gi,
    (match, prefix, quote, val) => {
      if (val.startsWith('data:') || val.startsWith('https://web.archive.org/')) return match;
      try {
        const abs = new URL(val, originalUrl).toString();
        return `${prefix}${quote}https://web.archive.org/web/${timestamp}im_/${abs}${quote}`;
      } catch {
        return match;
      }
    }
  );

  const liveUrl = `${displayUrl}${displayUrl.includes('?') ? '&' : '?'}xserver_live=1`;
  const reasonLabel =
    reason === '2006'
      ? `Wayback 2006 Archive (${formattedDate})`
      : `Wayback ${year} Archive (Earliest snapshot — no 2006 capture; ${formattedDate})`;

  const ytButton = isYouTubeRoot
    ? ` &nbsp;|&nbsp; <a href="http://youtube.xserver.net/" style="color:#cc0000;"><b>Open Live Playable YouTube 1999 Gateway</b></a>`
    : '';

  const banner = `<table width="100%" border="0" cellpadding="5" cellspacing="0" bgcolor="#ffffe1" style="border-bottom:1px solid #808080;font-family:Verdana,Arial,sans-serif;font-size:11px;color:#000000;">
    <tr>
      <td>
        <b>Xserver Wayback Engine:</b> ${escapeHtml(reasonLabel)} for <code>${escapeHtml(displayUrl)}</code>
        ${ytButton}
        &nbsp;|&nbsp; <a href="${escapeHtml(liveUrl)}" style="color:#0000cc;">View Live 2026 Site</a>
        &nbsp;|&nbsp; <a href="http://home.netscapeit.com/" style="color:#0000cc;">Netcenter</a>
      </td>
    </tr>
  </table>`;

  if (/<body[^>]*>/i.test(cleaned)) {
    cleaned = cleaned.replace(/<body([^>]*)>/i, `<body$1>${banner}`);
  } else {
    cleaned = `${banner}${cleaned}`;
  }

  return `${cleaned}${getBridgeScript(originalUrl)}`;
}
