import express from 'express';
import type { Request, Response } from 'express';
import fs from 'fs';
import net from 'net';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  getBridgeScript,
  renderAboutMozilla,
  renderAboutNetscapeit,
  renderAltaVistaPage,
  renderGeoCitiesPage,
  renderNetcenterPage,
  renderSlashdotPage,
  renderSpaceJamHubPage,
  renderUserPage,
  renderWinampVaultPage,
} from './xserver/sites.ts';
import type {
  GuestbookEntry,
  SearchableDoc,
  SlashdotStory,
  UserPublishedPage,
} from './xserver/sites.ts';
import {
  extractYouTubeVideoId,
  fetchYouTubeVideoDetail,
  isYouTubeUrl,
  renderYouTube1999Page,
  searchYouTubeVideos,
} from './xserver/youtube.ts';
import {
  runLiveWebSearchViaInteractions,
  transcodeUrlViaInteractions,
} from './xserver/interactions.ts';
import {
  adaptWaybackHtmlForNavigator,
  fetchWaybackHtml,
  lookupWaybackSnapshot,
} from './xserver/wayback.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = 3000;

interface LogEntry {
  id: string;
  timestamp: string;
  method: string;
  host: string;
  path: string;
  status: number;
  bytes: number;
  elapsedMs: number;
  userAgent: string;
}

const startedAt = Date.now();
let totalRequests = 0;
let totalBytesServed = 0;

const hostHits: Record<string, number> = {
  'home.netscapeit.com': 14289,
  'altavista.xserver.net': 5312,
  'geocities.xserver.net': 8914,
  'slashdot.xserver.org': 11204,
  'winamp.xserver.com': 7640,
  'spacejam.xserver.org': 4190,
  'xserver.local': 320,
  'webmaster.xserver.local': 215,
};

const guestbookEntries: GuestbookEntry[] = [
  {
    id: 'gb-1',
    name: 'DJ_Cyberia',
    email: 'dj@geocities.com',
    homepage: 'http://winamp.xserver.com/',
    message: 'Awesome Bryce 3D sphere!! Signed from my brand new 56k USRobotics Sportster modem!',
    createdAt: '1999-11-18 08:14',
  },
  {
    id: 'gb-2',
    name: 'NetscapeWizard',
    email: 'wizard@netscapeit.com',
    homepage: 'http://home.netscapeit.com/',
    message: 'Runs super fast in netscapeit 4.72! Keep adding cool WebRing links!',
    createdAt: '1999-11-17 22:45',
  },
  {
    id: 'gb-3',
    name: 'LinuxGuy99',
    email: 'tux@slashdot.xserver.org',
    homepage: 'http://slashdot.xserver.org/',
    message: 'Just compiled kernel 2.2.13 and browsing Xserver from XFree86. Y2K ready!',
    createdAt: '1999-11-16 19:03',
  },
];

const slashdotStories: SlashdotStory[] = [
  {
    id: 'story-xserver-y2k',
    title: 'Xserver/1.99 Passes Full Millennium Y2K Rollover Audit',
    author: 'CmdrTaco99',
    topic: 'Y2K & Servers',
    postedAt: 'Thursday Nov 18, 1999 @09:15AM',
    summary:
      'Xserver engineers announced today that all virtual host routers, HTTP/1.0 RFC 1945 header formatters, and CGI-BIN scripts inside Xserver/1.99 passed full 4-digit year rollover testing without a single clock glitch. Netscapeit Communicator users can inspect live response headers directly from View -> Xserver Headers.',
    comments: [
      {
        id: 'c-101',
        author: 'SysAdminDan',
        title: 'Re: Y2K Audit',
        body: 'Tested our Pentium II Xeon rack at 23:59:59 1999-12-31. Xserver did not blink once. Solid HTTP/1.0 stack.',
        score: 4,
        createdAt: '1999-11-18 09:22',
      },
      {
        id: 'c-102',
        author: 'PerlHacker',
        title: 'CGI-BIN scripts checked?',
        body: 'Yep, guestbook.cgi and counter.cgi both use full 4-digit years now. No "19100" bugs here.',
        score: 3,
        createdAt: '1999-11-18 09:28',
      },
    ],
  },
  {
    id: 'story-mozilla-m11',
    title: 'Mozilla Layout Milestone M11 Brings Faster Table Rendering',
    author: 'Hemos',
    topic: 'Browsers',
    postedAt: 'Wednesday Nov 17, 1999 @04:40PM',
    summary:
      'Browser enthusiasts testing the next generation of Netscape-derived engines report dramatic improvements in nested HTML 4.0 tables and CSS1 positioning. Meanwhile, netscapeit 4.72 remains the gold standard for classic portal compatibility.',
    comments: [
      {
        id: 'c-201',
        author: 'WebStandards',
        title: 'Tables vs CSS',
        body: 'Nested tables still rule the web in 1999, but it is great seeing cleaner rendering across both.',
        score: 2,
        createdAt: '1999-11-17 17:10',
      },
    ],
  },
  {
    id: 'story-mp3-winamp',
    title: 'Winamp 2.22 & 128kbps MP3s Reshape Late-Night Dial-Up Listening',
    author: 'RobMalda',
    topic: 'Audio & Shareware',
    postedAt: 'Tuesday Nov 16, 1999 @01:12PM',
    summary:
      'Even over a 56k V.90 dial-up line, enthusiasts are queuing up trackers, MIDI files, and MP3 encodes overnight. Check out the Xserver Shareware Vault for synthesized 1999 MIDI loops that stream instantaneously inside netscapeit.',
    comments: [],
  },
];

const userPages: UserPublishedPage[] = [
  {
    slug: 'welcome-99',
    title: "Tim's 1999 Web Links",
    author: 'Tim_99',
    createdAt: '1999-11-18',
    hits: 42,
    html: `<div style="font-family:Verdana,sans-serif;padding:24px;background:#fefce8;min-height:100%;">
      <h1 style="color:#003366;">Tim's 1999 Bookmark Directory</h1>
      <p>Built with <b>Netscapeit Composer</b> and hosted directly on <b>Xserver/1.99</b>!</p>
      <ul>
        <li><a href="http://home.netscapeit.com/">Netscapeit Netcenter</a></li>
        <li><a href="http://geocities.xserver.net/cyberia/99/">Cyberia '99 GeoCities</a></li>
        <li><a href="http://slashdot.xserver.org/">Slashdot '99 Tech News</a></li>
      </ul>
    </div>`,
  },
];

const INITIAL_HOST_HITS: Record<string, number> = { ...hostHits };
const INITIAL_GUESTBOOK_ENTRIES: GuestbookEntry[] = guestbookEntries.map((e) => ({ ...e }));
const INITIAL_SLASHDOT_COMMENTS = slashdotStories.map((s) => s.comments.map((c) => ({ ...c })));
const INITIAL_USER_PAGES: UserPublishedPage[] = userPages.map((p) => ({ ...p }));

const requestLog: LogEntry[] = [];

function recordRequest(entry: Omit<LogEntry, 'id' | 'timestamp'>): void {
  totalRequests += 1;
  totalBytesServed += entry.bytes;
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  requestLog.unshift({
    id: `req-${totalRequests}`,
    timestamp: `${hh}:${mm}:${ss}`,
    ...entry,
  });
  if (requestLog.length > 80) {
    requestLog.length = 80;
  }
}

function getRequestOrigin(req: Request): string {
  const proto = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'http';
  const host = req.get('host') || `localhost:${PORT}`;
  return `${proto}://${host}`;
}

function normalizeBrowseUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return 'http://home.netscapeit.com/';
  if (trimmed.startsWith('about:')) return trimmed.toLowerCase();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `http://${trimmed}`;
}

function isPrivateOrBlockedHostname(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  if (
    lower === 'localhost' ||
    lower === '0.0.0.0' ||
    lower.endsWith('.local') ||
    lower.endsWith('.internal') ||
    lower === 'metadata.google.internal'
  ) {
    return true;
  }

  const ipType = net.isIP(lower);
  if (ipType === 4) {
    const parts = lower.split('.').map(Number);
    const [a, b] = parts;
    if (a === 10 || a === 127 || a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
  } else if (ipType === 6) {
    if (lower === '::1' || lower.startsWith('fe80:') || lower.startsWith('fc') || lower.startsWith('fd')) {
      return true;
    }
  }
  return false;
}

function buildSearchIndex(): SearchableDoc[] {
  const baseDocs: SearchableDoc[] = [
    {
      url: 'http://home.netscapeit.com/',
      title: 'Netscapeit Netcenter — 1999 Web Portal',
      host: 'home.netscapeit.com',
      snippet: 'Your 1999 starting point on the Web: channels, tech markets (NSCP, YHOO, SUNW), headlines, and Xserver member links.',
      keywords: 'netscape netscapeit netcenter portal home stocks channels news',
      bytes: 7420,
      modified: '18-Nov-1999',
    },
    {
      url: 'http://geocities.xserver.net/cyberia/99/',
      title: "Cyberia '99 — GeoCities Area51 Personal Homepage & Guestbook",
      host: 'geocities.xserver.net',
      snippet: 'Bryce 3D raytraced landscape, under construction banner, 1999 WebRing navigation, CGI visitor counter, and live CGI guestbook.',
      keywords: 'geocities cyberia guestbook cgi webring bryce 3d counter personal homepage',
      bytes: 6180,
      modified: '18-Nov-1999',
    },
    {
      url: 'http://slashdot.xserver.org/',
      title: "Slashdot '99 — News for Nerds (Y2K, Mozilla M11, Linux, Winamp)",
      host: 'slashdot.xserver.org',
      snippet: 'Discussions on Xserver/1.99 Y2K rollover compliance, Mozilla Gecko M11, Linux 2.2, and 128kbps MP3 culture.',
      keywords: 'slashdot mozilla y2k linux kernel mp3 news nerds comments',
      bytes: 8240,
      modified: '18-Nov-1999',
    },
    {
      url: 'http://winamp.xserver.com/',
      title: 'Winamp & 1999 Shareware Vault (MIDI Jukebox & Downloads)',
      host: 'winamp.xserver.com',
      snippet: 'Download netscapeit 4.72, Winamp 2.22, mIRC 5.6, ICQ 99b, PKZIP 2.70, and play Web Audio MIDI tracker loops.',
      keywords: 'winamp shareware download midi mp3 mirc icq pkzip audio jukebox',
      bytes: 4920,
      modified: '18-Nov-1999',
    },
    {
      url: 'http://spacejam.xserver.org/',
      title: 'Planet 1999 — The Xserver WebRing Hub',
      host: 'spacejam.xserver.org',
      snippet: 'Classic starfield orbital directory connecting every virtual host and easter egg running on Xserver.',
      keywords: 'planet spacejam webring orbital hub directory links',
      bytes: 3140,
      modified: '18-Nov-1999',
    },
    {
      url: 'http://xserver.local/',
      title: 'Xserver/1.99 Control & HTTP Monitor Console',
      host: 'xserver.local',
      snippet: 'Inspect real-time HTTP/1.0 request logs, virtual hosts, CGI-BIN endpoints, and server uptime on Xserver.',
      keywords: 'xserver console admin logs http virtual host monitor server',
      bytes: 4100,
      modified: '18-Nov-1999',
    },
    {
      url: 'http://webmaster.xserver.local/builder.html',
      title: 'Netscapeit Composer — Live HTML Page Publisher',
      host: 'webmaster.xserver.local',
      snippet: 'Author classic 1999 HTML pages with retro templates and publish them directly to Xserver.',
      keywords: 'composer html editor builder publish xserver webmaster',
      bytes: 3650,
      modified: '18-Nov-1999',
    },
    {
      url: 'about:mozilla',
      title: 'The Book of Mozilla, 12:10',
      host: 'about',
      snippet: 'And the beast shall come forth surrounded by a roiling cloud of vengeance...',
      keywords: 'mozilla easter egg book about',
      bytes: 980,
      modified: '10-Dec-1998',
    },
  ];

  const customDocs: SearchableDoc[] = userPages.map((p) => ({
    url: `http://xserver.local/pages/${encodeURIComponent(p.slug)}`,
    title: `${p.title} (Member Page by ${p.author})`,
    host: 'xserver.local',
    snippet: p.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 140),
    keywords: `${p.title} ${p.author} ${p.slug} member page`,
    bytes: Buffer.byteLength(p.html, 'utf8'),
    modified: p.createdAt,
  }));

  return [...baseDocs, ...customDocs];
}

function sanitizeExternalHtml(
  rawHtml: string,
  baseUrl: string,
  liveReason?: 'brand-new-2025-plus' | 'user-bypass' | 'wayback-error'
): string {
  // Remove remote script/iframe/object/embed tags and inline event handlers
  let cleaned = rawHtml
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');

  // Rewrite relative href/src attributes to absolute URLs so links stay navigable
  cleaned = cleaned.replace(/(href|src)\s*=\s*(["'])([^"']+)\2/gi, (match, attr, quote, val) => {
    if (
      val.startsWith('#') ||
      val.startsWith('data:') ||
      val.startsWith('mailto:') ||
      val.startsWith('javascript:')
    ) {
      return match;
    }
    try {
      const abs = new URL(val, baseUrl).toString();
      return `${attr}=${quote}${abs}${quote}`;
    } catch {
      return match;
    }
  });

  const cleanNoLive = baseUrl.replace(/([?&])xserver_live=1(&|$)/, '$1').replace(/[?&]$/, '');
  const transcodeLink = baseUrl.includes('xserver_transcode=1')
    ? ''
    : ` &nbsp;|&nbsp; <a href="${cleanNoLive}${cleanNoLive.includes('?') ? '&' : '?'}xserver_transcode=1" style="color:#003366;"><b>Render as 1999 HTML (Interactions API)</b></a>`;

  const waybackBackLink =
    liveReason === 'user-bypass'
      ? ` &nbsp;|&nbsp; <a href="${cleanNoLive}" style="color:#0000cc;"><b>Back to Wayback Archive</b></a>`
      : '';

  const label =
    liveReason === 'brand-new-2025-plus'
      ? 'Live 2026 Site (Brand new — no pre-2025 Wayback archive; loaded directly)'
      : liveReason === 'user-bypass'
      ? 'Live Site (Wayback bypassed)'
      : 'Xserver External HTTP Proxy';

  const banner = `<table width="100%" border="0" cellpadding="5" cellspacing="0" bgcolor="#ffffe1" style="border-bottom:1px solid #808080;font-family:Verdana,Arial,sans-serif;font-size:11px;color:#000000;">
    <tr>
      <td>
        <b>${label}:</b> <code>${cleanNoLive.replace(/</g, '&lt;')}</code>${waybackBackLink}${transcodeLink} &nbsp;|&nbsp;
        <a href="http://home.netscapeit.com/" style="color:#0000cc;">Netcenter</a>
      </td>
    </tr>
  </table>`;

  if (/<body[^>]*>/i.test(cleaned)) {
    cleaned = cleaned.replace(/<body([^>]*)>/i, `<body$1>${banner}`);
  } else {
    cleaned = `${banner}${cleaned}`;
  }

  return `${cleaned}${getBridgeScript(cleanNoLive)}`;
}

function renderNotFoundPage(url: string, reason: string): string {
  const safeUrl = url.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const safeReason = reason.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return `<!DOCTYPE HTML>
<html>
<head><title>404 Not Found — Xserver/1.99</title></head>
<body bgcolor="#ffffff" text="#000000" style="font-family:Verdana,Arial,sans-serif;margin:32px;">
  <table width="600" align="center" border="1" bordercolor="#990000" cellpadding="14" cellspacing="0">
    <tr><td bgcolor="#990000"><font color="#ffffff" size="3"><b>Xserver/1.99 &mdash; File Not Found (HTTP 404)</b></font></td></tr>
    <tr>
      <td style="line-height:1.6;">
        <p><b>Requested URL:</b> <code>${safeUrl}</code></p>
        <p>${safeReason}</p>
        <hr size="1" noshade color="#cccccc">
        <p><a href="http://home.netscapeit.com/">Return to Netscapeit Netcenter</a> &middot; <a href="http://altavista.xserver.net/">Search AltaVista</a></p>
      </td>
    </tr>
  </table>
  ${getBridgeScript('http://xserver.local/404')}
</body>
</html>`;
}

async function startServer(): Promise<void> {
  const app = express();
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Attach Xserver identity headers to all API responses
  app.use('/api/xserver', (_req, res, next) => {
    res.setHeader('Server', 'Xserver/1.99 (Unix)');
    res.setHeader('X-Powered-By', 'Xserver/1.99');
    res.setHeader('X-Netscape-Protocol', 'HTTP/1.0');
    next();
  });

  // Main Xserver Virtual Host + Proxy Browse Endpoint
  app.get('/api/xserver/browse', async (req: Request, res: Response) => {
    const startMs = Date.now();
    const rawUrl = String(req.query.url || 'http://home.netscapeit.com/');
    const normalizedUrl = normalizeBrowseUrl(rawUrl);
    const origin = getRequestOrigin(req);
    const userAgent = String(req.headers['user-agent'] || 'Mozilla/4.72 [en] (Win98; I; netscapeit)');

    // Handle about:* pages
    if (normalizedUrl === 'about:mozilla') {
      const html = `${renderAboutMozilla()}${getBridgeScript(normalizedUrl)}`;
      const bytes = Buffer.byteLength(html, 'utf8');
      const elapsedMs = Math.max(1, Date.now() - startMs);
      recordRequest({ method: 'GET', host: 'about', path: ':mozilla', status: 200, bytes, elapsedMs, userAgent });
      res.json({
        url: rawUrl,
        normalizedUrl,
        host: 'about',
        path: ':mozilla',
        title: 'The Book of Mozilla',
        status: 200,
        statusText: 'OK',
        headers: {
          Server: 'Xserver/1.99 (Unix)',
          'Content-Type': 'text/html; charset=iso-8859-1',
          'Content-Length': String(bytes),
        },
        bytes,
        elapsedMs,
        contentType: 'text/html',
        isExternal: false,
        isSecure: false,
        mode: 'html',
        html,
      });
      return;
    }

    if (normalizedUrl === 'about:netscapeit' || normalizedUrl === 'about:blank') {
      const html = `${renderAboutNetscapeit()}${getBridgeScript(normalizedUrl)}`;
      const bytes = Buffer.byteLength(html, 'utf8');
      const elapsedMs = Math.max(1, Date.now() - startMs);
      recordRequest({ method: 'GET', host: 'about', path: ':netscapeit', status: 200, bytes, elapsedMs, userAgent });
      res.json({
        url: rawUrl,
        normalizedUrl,
        host: 'about',
        path: ':netscapeit',
        title: 'About netscapeit 4.72 & Xserver/1.99',
        status: 200,
        statusText: 'OK',
        headers: {
          Server: 'Xserver/1.99 (Unix)',
          'Content-Type': 'text/html; charset=iso-8859-1',
          'Content-Length': String(bytes),
        },
        bytes,
        elapsedMs,
        contentType: 'text/html',
        isExternal: false,
        isSecure: false,
        mode: 'html',
        html,
      });
      return;
    }

    let parsed: URL;
    try {
      parsed = new URL(normalizedUrl);
    } catch {
      const html = renderNotFoundPage(rawUrl, 'Malformed URL syntax.');
      const bytes = Buffer.byteLength(html, 'utf8');
      const elapsedMs = Math.max(1, Date.now() - startMs);
      recordRequest({ method: 'GET', host: 'invalid', path: '/', status: 400, bytes, elapsedMs, userAgent });
      res.json({
        url: rawUrl,
        normalizedUrl,
        host: 'invalid',
        path: '/',
        title: '400 Bad Request',
        status: 400,
        statusText: 'Bad Request',
        headers: { Server: 'Xserver/1.99 (Unix)', 'Content-Type': 'text/html' },
        bytes,
        elapsedMs,
        contentType: 'text/html',
        isExternal: false,
        isSecure: false,
        mode: 'html',
        html,
      });
      return;
    }

    const host = parsed.hostname.toLowerCase();
    const reqPath = parsed.pathname || '/';

    // 1. Netscapeit Netcenter
    if (host === 'home.netscapeit.com' || host === 'netscapeit.com' || host === 'www.netscapeit.com') {
      hostHits['home.netscapeit.com'] = (hostHits['home.netscapeit.com'] || 0) + 1;
      const body = renderNetcenterPage({
        origin,
        hits: hostHits['home.netscapeit.com'],
        userPages,
      });
      const html = `${body}${getBridgeScript(normalizedUrl)}`;
      const bytes = Buffer.byteLength(html, 'utf8');
      const elapsedMs = Math.max(2, Date.now() - startMs);
      recordRequest({ method: 'GET', host, path: reqPath, status: 200, bytes, elapsedMs, userAgent });
      res.json({
        url: rawUrl,
        normalizedUrl,
        host,
        path: reqPath,
        title: 'Netscapeit Netcenter — Welcome to the 1999 Web',
        status: 200,
        statusText: 'OK',
        headers: {
          Server: 'Xserver/1.99 (Unix)',
          'X-Virtual-Host': 'home.netscapeit.com',
          'Content-Type': 'text/html; charset=iso-8859-1',
          'Content-Length': String(bytes),
          Connection: 'close',
        },
        bytes,
        elapsedMs,
        contentType: 'text/html',
        isExternal: false,
        isSecure: false,
        mode: 'html',
        html,
      });
      return;
    }

    // 2. AltaVista Xserver Search (Local, YouTube, or Interactions Live Web)
    if (host === 'altavista.xserver.net') {
      hostHits['altavista.xserver.net'] = (hostHits['altavista.xserver.net'] || 0) + 1;
      const q = parsed.searchParams.get('q') || '';
      const mode = parsed.searchParams.get('mode') || 'local';

      if (mode === 'youtube' && q.trim()) {
        try {
          const ytResults = await searchYouTubeVideos(q);
          const html = renderYouTube1999Page({
            baseUrl: normalizedUrl,
            query: q,
            video: null,
            results: ytResults,
          });
          const bytes = Buffer.byteLength(html, 'utf8');
          const elapsedMs = Math.max(5, Date.now() - startMs);
          recordRequest({ method: 'GET', host: 'youtube.xserver.net', path: `/results?search_query=${encodeURIComponent(q)}`, status: 200, bytes, elapsedMs, userAgent });
          res.json({
            url: rawUrl,
            normalizedUrl,
            host: 'youtube.xserver.net',
            path: '/results',
            title: `YouTube 1999 Search: ${q}`,
            status: 200,
            statusText: 'OK',
            headers: {
              Server: 'Xserver/1.99 (Unix)',
              'X-Virtual-Host': 'youtube.xserver.net',
              'Content-Type': 'text/html; charset=utf-8',
              'Content-Length': String(bytes),
            },
            bytes,
            elapsedMs,
            contentType: 'text/html',
            isExternal: true,
            isSecure: false,
            mode: 'html',
            html,
          });
          return;
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Failed to fetch YouTube search.';
          const html = renderYouTube1999Page({
            baseUrl: normalizedUrl,
            query: q,
            video: null,
            results: [],
            errorMsg: msg,
          });
          const bytes = Buffer.byteLength(html, 'utf8');
          const elapsedMs = Math.max(5, Date.now() - startMs);
          recordRequest({ method: 'GET', host: 'youtube.xserver.net', path: '/results', status: 502, bytes, elapsedMs, userAgent });
          res.json({
            url: rawUrl,
            normalizedUrl,
            host: 'youtube.xserver.net',
            path: '/results',
            title: 'YouTube 1999 Search Error',
            status: 502,
            statusText: 'Bad Gateway',
            headers: { Server: 'Xserver/1.99 (Unix)', 'Content-Type': 'text/html' },
            bytes,
            elapsedMs,
            contentType: 'text/html',
            isExternal: true,
            isSecure: false,
            mode: 'html',
            html,
          });
          return;
        }
      }

      if (mode === 'web' && q.trim()) {
        try {
          const html = await runLiveWebSearchViaInteractions(q);
          const bytes = Buffer.byteLength(html, 'utf8');
          const elapsedMs = Math.max(5, Date.now() - startMs);
          recordRequest({ method: 'GET', host, path: `${reqPath}${parsed.search}`, status: 200, bytes, elapsedMs, userAgent });
          res.json({
            url: rawUrl,
            normalizedUrl,
            host,
            path: reqPath,
            title: `AltaVista Live Web: ${q}`,
            status: 200,
            statusText: 'OK',
            headers: {
              Server: 'Xserver/1.99 (Unix)',
              'X-Interactions-Model': 'gemini-4-hydrogen',
              'Content-Type': 'text/html; charset=utf-8',
              'Content-Length': String(bytes),
            },
            bytes,
            elapsedMs,
            contentType: 'text/html',
            isExternal: true,
            isSecure: true,
            mode: 'html',
            html,
          });
          return;
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Interactions API web search failed.';
          const html = renderNotFoundPage(normalizedUrl, `Live Web Search via Interactions API failed: ${msg}`);
          const bytes = Buffer.byteLength(html, 'utf8');
          const elapsedMs = Math.max(5, Date.now() - startMs);
          recordRequest({ method: 'GET', host, path: reqPath, status: 502, bytes, elapsedMs, userAgent });
          res.json({
            url: rawUrl,
            normalizedUrl,
            host,
            path: reqPath,
            title: 'Live Web Search Error — Xserver',
            status: 502,
            statusText: 'Bad Gateway',
            headers: { Server: 'Xserver/1.99 (Unix)', 'Content-Type': 'text/html' },
            bytes,
            elapsedMs,
            contentType: 'text/html',
            isExternal: false,
            isSecure: false,
            mode: 'html',
            html,
          });
          return;
        }
      }

      const terms = q
        .toLowerCase()
        .split(/\s+/)
        .map((t) => t.trim())
        .filter(Boolean);

      const allDocs = buildSearchIndex();
      const results =
        terms.length === 0
          ? []
          : allDocs.filter((doc) => {
              const hay = `${doc.title} ${doc.snippet} ${doc.keywords} ${doc.url}`.toLowerCase();
              return terms.every((t) => hay.includes(t));
            });

      const body = renderAltaVistaPage({ query: q, results });
      const html = `${body}${getBridgeScript(normalizedUrl)}`;
      const bytes = Buffer.byteLength(html, 'utf8');
      const elapsedMs = Math.max(2, Date.now() - startMs);
      recordRequest({
        method: 'GET',
        host,
        path: `${reqPath}${parsed.search}`,
        status: 200,
        bytes,
        elapsedMs,
        userAgent,
      });
      res.json({
        url: rawUrl,
        normalizedUrl,
        host,
        path: reqPath,
        title: q ? `AltaVista Xserver Search: ${q}` : 'AltaVista Xserver Search',
        status: 200,
        statusText: 'OK',
        headers: {
          Server: 'Xserver/1.99 (Unix)',
          'X-Virtual-Host': 'altavista.xserver.net',
          'X-CGI-Script': '/cgi-bin/search.cgi',
          'Content-Type': 'text/html; charset=iso-8859-1',
          'Content-Length': String(bytes),
        },
        bytes,
        elapsedMs,
        contentType: 'text/html',
        isExternal: false,
        isSecure: false,
        mode: 'html',
        html,
      });
      return;
    }

    // 2b. YouTube 1999 Gateway & Direct YouTube Video/Search URL Fetcher
    // Note: bare youtube.com/ root (without video ID or search query) goes to Wayback 2006 unless xserver_live=1 or youtube.xserver.net
    const ytQueryCheck = parsed.searchParams.get('search_query') || parsed.searchParams.get('q') || '';
    const ytVideoIdCheck = extractYouTubeVideoId(parsed);
    const shouldUseYouTubeGateway =
      isYouTubeUrl(parsed) &&
      (host === 'youtube.xserver.net' ||
        Boolean(ytVideoIdCheck) ||
        Boolean(ytQueryCheck) ||
        parsed.searchParams.get('xserver_live') === '1');

    if (shouldUseYouTubeGateway) {
      hostHits['youtube.xserver.net'] = (hostHits['youtube.xserver.net'] || 0) + 1;
      const searchQ = ytQueryCheck;
      let targetUrlForId = parsed;
      if (searchQ.includes('youtube.com/') || searchQ.includes('youtu.be/')) {
        try {
          targetUrlForId = new URL(searchQ.startsWith('http') ? searchQ : `https://${searchQ}`);
        } catch {
          targetUrlForId = parsed;
        }
      }
      const videoId = extractYouTubeVideoId(targetUrlForId);

      try {
        const [videoDetail, searchResults] = await Promise.all([
          videoId ? fetchYouTubeVideoDetail(videoId) : Promise.resolve(null),
          searchYouTubeVideos(
            videoId
              ? searchQ || 'netscape navigator 1999'
              : searchQ || 'netscape navigator 1999'
          ),
        ]);

        const html = renderYouTube1999Page({
          baseUrl: normalizedUrl,
          query: searchQ,
          video: videoDetail,
          results: searchResults,
        });
        const bytes = Buffer.byteLength(html, 'utf8');
        const elapsedMs = Math.max(5, Date.now() - startMs);
        recordRequest({ method: 'GET', host, path: `${reqPath}${parsed.search}`, status: 200, bytes, elapsedMs, userAgent });
        res.json({
          url: rawUrl,
          normalizedUrl,
          host,
          path: reqPath,
          title: videoDetail ? `${videoDetail.title} — YouTube 1999` : 'YouTube 1999 Gateway — Xserver',
          status: 200,
          statusText: 'OK',
          headers: {
            Server: 'Xserver/1.99 (Unix)',
            'X-Virtual-Host': 'youtube.xserver.net',
            'Content-Type': 'text/html; charset=utf-8',
            'Content-Length': String(bytes),
          },
          bytes,
          elapsedMs,
          contentType: 'text/html',
          isExternal: true,
          isSecure: parsed.protocol === 'https:',
          mode: 'html',
          html,
        });
        return;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unable to fetch YouTube data.';
        const html = renderYouTube1999Page({
          baseUrl: normalizedUrl,
          query: searchQ,
          video: videoId
            ? {
                videoId,
                title: `YouTube Video (${videoId})`,
                authorName: 'YouTube',
                authorUrl: 'https://www.youtube.com/',
                thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
                description: '',
              }
            : null,
          results: [],
          errorMsg: msg,
        });
        const bytes = Buffer.byteLength(html, 'utf8');
        const elapsedMs = Math.max(5, Date.now() - startMs);
        recordRequest({ method: 'GET', host, path: reqPath, status: 502, bytes, elapsedMs, userAgent });
        res.json({
          url: rawUrl,
          normalizedUrl,
          host,
          path: reqPath,
          title: 'YouTube 1999 Gateway — Xserver',
          status: 502,
          statusText: 'Bad Gateway',
          headers: { Server: 'Xserver/1.99 (Unix)', 'Content-Type': 'text/html' },
          bytes,
          elapsedMs,
          contentType: 'text/html',
          isExternal: true,
          isSecure: false,
          mode: 'html',
          html,
        });
        return;
      }
    }

    // 3. GeoCities Cyberia '99
    if (host === 'geocities.xserver.net') {
      hostHits['geocities.xserver.net'] = (hostHits['geocities.xserver.net'] || 0) + 1;
      const justSigned = parsed.searchParams.get('signed') === '1';
      const body = renderGeoCitiesPage({
        origin,
        hits: hostHits['geocities.xserver.net'],
        entries: guestbookEntries,
        justSigned,
      });
      const html = `${body}${getBridgeScript(normalizedUrl)}`;
      const bytes = Buffer.byteLength(html, 'utf8');
      const elapsedMs = Math.max(2, Date.now() - startMs);
      recordRequest({ method: 'GET', host, path: reqPath, status: 200, bytes, elapsedMs, userAgent });
      res.json({
        url: rawUrl,
        normalizedUrl,
        host,
        path: reqPath,
        title: "~*~ Welcome to Cyberia '99 ~*~ GeoCities Area51",
        status: 200,
        statusText: 'OK',
        headers: {
          Server: 'Xserver/1.99 (Unix)',
          'X-Virtual-Host': 'geocities.xserver.net',
          'X-CGI-Script': '/cgi-bin/counter.cgi, /cgi-bin/guestbook.cgi',
          'Content-Type': 'text/html; charset=iso-8859-1',
          'Content-Length': String(bytes),
        },
        bytes,
        elapsedMs,
        contentType: 'text/html',
        isExternal: false,
        isSecure: false,
        mode: 'html',
        html,
      });
      return;
    }

    // 4. Slashdot '99
    if (host === 'slashdot.xserver.org') {
      hostHits['slashdot.xserver.org'] = (hostHits['slashdot.xserver.org'] || 0) + 1;
      const justPostedStoryId = parsed.searchParams.get('posted') || undefined;
      const body = renderSlashdotPage({
        origin,
        stories: slashdotStories,
        justPostedStoryId,
      });
      const html = `${body}${getBridgeScript(normalizedUrl)}`;
      const bytes = Buffer.byteLength(html, 'utf8');
      const elapsedMs = Math.max(2, Date.now() - startMs);
      recordRequest({ method: 'GET', host, path: reqPath, status: 200, bytes, elapsedMs, userAgent });
      res.json({
        url: rawUrl,
        normalizedUrl,
        host,
        path: reqPath,
        title: "Slashdot '99 — News for Nerds. Stuff that Matters.",
        status: 200,
        statusText: 'OK',
        headers: {
          Server: 'Xserver/1.99 (Unix)',
          'X-Virtual-Host': 'slashdot.xserver.org',
          'Content-Type': 'text/html; charset=iso-8859-1',
          'Content-Length': String(bytes),
        },
        bytes,
        elapsedMs,
        contentType: 'text/html',
        isExternal: false,
        isSecure: false,
        mode: 'html',
        html,
      });
      return;
    }

    // 5. Winamp & Shareware Vault
    if (host === 'winamp.xserver.com') {
      hostHits['winamp.xserver.com'] = (hostHits['winamp.xserver.com'] || 0) + 1;
      const body = renderWinampVaultPage();
      const html = `${body}${getBridgeScript(normalizedUrl)}`;
      const bytes = Buffer.byteLength(html, 'utf8');
      const elapsedMs = Math.max(2, Date.now() - startMs);
      recordRequest({ method: 'GET', host, path: reqPath, status: 200, bytes, elapsedMs, userAgent });
      res.json({
        url: rawUrl,
        normalizedUrl,
        host,
        path: reqPath,
        title: 'Winamp & 1999 Shareware Vault — Xserver',
        status: 200,
        statusText: 'OK',
        headers: {
          Server: 'Xserver/1.99 (Unix)',
          'X-Virtual-Host': 'winamp.xserver.com',
          'Content-Type': 'text/html; charset=iso-8859-1',
          'Content-Length': String(bytes),
        },
        bytes,
        elapsedMs,
        contentType: 'text/html',
        isExternal: false,
        isSecure: false,
        mode: 'html',
        html,
      });
      return;
    }

    // 6. Planet 1999 WebRing Hub
    if (host === 'spacejam.xserver.org') {
      hostHits['spacejam.xserver.org'] = (hostHits['spacejam.xserver.org'] || 0) + 1;
      const body = renderSpaceJamHubPage();
      const html = `${body}${getBridgeScript(normalizedUrl)}`;
      const bytes = Buffer.byteLength(html, 'utf8');
      const elapsedMs = Math.max(2, Date.now() - startMs);
      recordRequest({ method: 'GET', host, path: reqPath, status: 200, bytes, elapsedMs, userAgent });
      res.json({
        url: rawUrl,
        normalizedUrl,
        host,
        path: reqPath,
        title: 'Planet 1999 — The Xserver WebRing Hub',
        status: 200,
        statusText: 'OK',
        headers: {
          Server: 'Xserver/1.99 (Unix)',
          'X-Virtual-Host': 'spacejam.xserver.org',
          'Content-Type': 'text/html; charset=iso-8859-1',
          'Content-Length': String(bytes),
        },
        bytes,
        elapsedMs,
        contentType: 'text/html',
        isExternal: false,
        isSecure: false,
        mode: 'html',
        html,
      });
      return;
    }

    // 7. Xserver Console or User-Published Pages on xserver.local
    if (host === 'xserver.local') {
      if (reqPath.startsWith('/pages/')) {
        const slug = decodeURIComponent(reqPath.replace('/pages/', '').replace(/\.html$/, ''));
        const found = userPages.find((p) => p.slug === slug);
        if (!found) {
          const html = renderNotFoundPage(normalizedUrl, `No member page named "${slug}" exists on Xserver yet.`);
          const bytes = Buffer.byteLength(html, 'utf8');
          const elapsedMs = Math.max(1, Date.now() - startMs);
          recordRequest({ method: 'GET', host, path: reqPath, status: 404, bytes, elapsedMs, userAgent });
          res.json({
            url: rawUrl,
            normalizedUrl,
            host,
            path: reqPath,
            title: '404 Not Found — Xserver/1.99',
            status: 404,
            statusText: 'Not Found',
            headers: { Server: 'Xserver/1.99 (Unix)', 'Content-Type': 'text/html' },
            bytes,
            elapsedMs,
            contentType: 'text/html',
            isExternal: false,
            isSecure: false,
            mode: 'html',
            html,
          });
          return;
        }
        found.hits += 1;
        const body = renderUserPage(found);
        const html = `${body}${getBridgeScript(normalizedUrl)}`;
        const bytes = Buffer.byteLength(html, 'utf8');
        const elapsedMs = Math.max(1, Date.now() - startMs);
        recordRequest({ method: 'GET', host, path: reqPath, status: 200, bytes, elapsedMs, userAgent });
        res.json({
          url: rawUrl,
          normalizedUrl,
          host,
          path: reqPath,
          title: `${found.title} — Hosted on Xserver`,
          status: 200,
          statusText: 'OK',
          headers: {
            Server: 'Xserver/1.99 (Unix)',
            'X-Virtual-Host': 'xserver.local',
            'Content-Type': 'text/html; charset=utf-8',
            'Content-Length': String(bytes),
          },
          bytes,
          elapsedMs,
          contentType: 'text/html',
          isExternal: false,
          isSecure: false,
          mode: 'html',
          html,
        });
        return;
      }

      hostHits['xserver.local'] = (hostHits['xserver.local'] || 0) + 1;
      const summaryHtml = `<!-- Xserver/1.99 Console View -->\n<html><head><title>Xserver/1.99 Control Console</title></head><body><h1>Xserver/1.99 Active</h1><p>Total requests: ${totalRequests + 1}</p></body></html>`;
      const bytes = Buffer.byteLength(summaryHtml, 'utf8');
      const elapsedMs = Math.max(1, Date.now() - startMs);
      recordRequest({ method: 'GET', host, path: reqPath, status: 200, bytes, elapsedMs, userAgent });
      res.json({
        url: rawUrl,
        normalizedUrl,
        host,
        path: reqPath,
        title: 'Xserver/1.99 Control & Monitor Console',
        status: 200,
        statusText: 'OK',
        headers: {
          Server: 'Xserver/1.99 (Unix)',
          'X-Virtual-Host': 'xserver.local',
          'Content-Type': 'text/html; charset=utf-8',
        },
        bytes,
        elapsedMs,
        contentType: 'text/html',
        isExternal: false,
        isSecure: false,
        mode: 'xserver-console',
        html: summaryHtml,
      });
      return;
    }

    // 8. Netscapeit Composer
    if (host === 'webmaster.xserver.local') {
      hostHits['webmaster.xserver.local'] = (hostHits['webmaster.xserver.local'] || 0) + 1;
      const composerHtml = `<!-- Netscapeit Composer Studio -->\n<html><head><title>Netscapeit Composer</title></head><body><h1>Netscapeit Composer</h1></body></html>`;
      const bytes = Buffer.byteLength(composerHtml, 'utf8');
      const elapsedMs = Math.max(1, Date.now() - startMs);
      recordRequest({ method: 'GET', host, path: reqPath, status: 200, bytes, elapsedMs, userAgent });
      res.json({
        url: rawUrl,
        normalizedUrl,
        host,
        path: reqPath,
        title: 'Netscapeit Composer — Publish to Xserver',
        status: 200,
        statusText: 'OK',
        headers: {
          Server: 'Xserver/1.99 (Unix)',
          'X-Virtual-Host': 'webmaster.xserver.local',
          'Content-Type': 'text/html; charset=utf-8',
        },
        bytes,
        elapsedMs,
        contentType: 'text/html',
        isExternal: false,
        isSecure: false,
        mode: 'composer',
        html: composerHtml,
      });
      return;
    }

    // 9. External HTTP/HTTPS Proxy via Xserver
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      const html = renderNotFoundPage(normalizedUrl, `Unsupported protocol "${parsed.protocol}". Use http://, https://, or about:.`);
      const bytes = Buffer.byteLength(html, 'utf8');
      recordRequest({ method: 'GET', host, path: reqPath, status: 400, bytes, elapsedMs: 1, userAgent });
      res.json({
        url: rawUrl,
        normalizedUrl,
        host,
        path: reqPath,
        title: 'Unsupported Protocol',
        status: 400,
        statusText: 'Bad Request',
        headers: { Server: 'Xserver/1.99 (Unix)', 'Content-Type': 'text/html' },
        bytes,
        elapsedMs: 1,
        contentType: 'text/html',
        isExternal: true,
        isSecure: false,
        mode: 'html',
        html,
      });
      return;
    }

    if (isPrivateOrBlockedHostname(host)) {
      const html = renderNotFoundPage(normalizedUrl, 'Xserver Proxy blocked access to private or local network address.');
      const bytes = Buffer.byteLength(html, 'utf8');
      recordRequest({ method: 'GET', host, path: reqPath, status: 403, bytes, elapsedMs: 1, userAgent });
      res.json({
        url: rawUrl,
        normalizedUrl,
        host,
        path: reqPath,
        title: '403 Forbidden — Xserver Proxy',
        status: 403,
        statusText: 'Forbidden',
        headers: { Server: 'Xserver/1.99 (Unix)', 'Content-Type': 'text/html' },
        bytes,
        elapsedMs: 1,
        contentType: 'text/html',
        isExternal: true,
        isSecure: false,
        mode: 'html',
        html,
      });
      return;
    }

    try {
      if (parsed.searchParams.get('xserver_transcode') === '1') {
        const cleanTarget = new URL(normalizedUrl);
        cleanTarget.searchParams.delete('xserver_transcode');
        const finalHtml = await transcodeUrlViaInteractions(cleanTarget.toString());
        const bytes = Buffer.byteLength(finalHtml, 'utf8');
        const elapsedMs = Math.max(5, Date.now() - startMs);
        recordRequest({ method: 'GET', host, path: reqPath, status: 200, bytes, elapsedMs, userAgent });
        res.json({
          url: rawUrl,
          normalizedUrl,
          host,
          path: reqPath,
          title: `${host} (1999 Interactions Edition)`,
          status: 200,
          statusText: 'OK',
          headers: {
            Server: 'Xserver/1.99 Proxy + Interactions API',
            'X-Interactions-Model': 'gemini-4-hydrogen',
            'Content-Type': 'text/html; charset=utf-8',
            'Content-Length': String(bytes),
          },
          bytes,
          elapsedMs,
          contentType: 'text/html',
          isExternal: true,
          isSecure: parsed.protocol === 'https:',
          mode: 'html',
          html: finalHtml,
        });
        return;
      }

      const bypassWayback = parsed.searchParams.get('xserver_live') === '1';
      let liveReason: 'brand-new-2025-plus' | 'user-bypass' | 'wayback-error' = bypassWayback
        ? 'user-bypass'
        : 'wayback-error';

      // Wayback Machine Time-Machine Engine:
      // 1) Prefer 2006 snapshot for any website
      // 2) If not around in 2006 (e.g., made in 2007+), use earliest pre-2025 snapshot
      // 3) If brand new (2025/2026 only), skip Wayback and load live directly!
      if (!bypassWayback) {
        const cleanLookupUrl = new URL(normalizedUrl);
        cleanLookupUrl.searchParams.delete('xserver_live');
        const lookup = await lookupWaybackSnapshot(cleanLookupUrl.toString());

        if (lookup.found && lookup.timestamp && lookup.archivedOriginalUrl && (lookup.reason === '2006' || lookup.reason === 'earliest-historical')) {
          const archived = await fetchWaybackHtml(lookup.timestamp, lookup.archivedOriginalUrl);
          const titleMatch = archived.html.match(/<title[^>]*>([^<]+)<\/title>/i);
          const archivedTitle = titleMatch ? titleMatch[1].trim() : cleanLookupUrl.hostname;
          const finalHtml = adaptWaybackHtmlForNavigator({
            rawHtml: archived.html,
            originalUrl: lookup.archivedOriginalUrl,
            displayUrl: cleanLookupUrl.toString(),
            timestamp: lookup.timestamp,
            reason: lookup.reason,
            isYouTubeRoot: isYouTubeUrl(parsed),
          });
          const bytes = Buffer.byteLength(finalHtml, 'utf8');
          const elapsedMs = Math.max(5, Date.now() - startMs);
          recordRequest({
            method: 'GET',
            host,
            path: `${reqPath} [wayback:${lookup.year}]`,
            status: archived.status,
            bytes,
            elapsedMs,
            userAgent,
          });
          res.json({
            url: rawUrl,
            normalizedUrl: cleanLookupUrl.toString(),
            host,
            path: reqPath,
            title: `${archivedTitle} (${lookup.year} Wayback)`,
            status: archived.status,
            statusText: archived.statusText,
            headers: {
              Server: 'Xserver/1.99 Wayback Engine -> web.archive.org',
              'X-Wayback-Mode': lookup.reason,
              'X-Wayback-Timestamp': lookup.timestamp,
              'X-Wayback-Original': lookup.archivedOriginalUrl,
              'Content-Type': 'text/html; charset=utf-8',
              'Content-Length': String(bytes),
            },
            bytes,
            elapsedMs,
            contentType: 'text/html',
            isExternal: true,
            isSecure: false,
            mode: 'html',
            html: finalHtml,
          });
          return;
        }

        if (lookup.reason === 'brand-new-2025-plus') {
          liveReason = 'brand-new-2025-plus';
        }
      }

      const fetchTargetUrl = new URL(normalizedUrl);
      fetchTargetUrl.searchParams.delete('xserver_live');

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 6500);
      const upstream = await fetch(fetchTargetUrl.toString(), {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/4.72 [en] (Xserver/1.99 Proxy; netscapeit)',
          Accept: 'text/html,application/xhtml+xml,text/plain,*/*',
        },
      });
      clearTimeout(timer);

      const contentType = upstream.headers.get('content-type') || 'text/html';
      const rawText = await upstream.text();
      const titleMatch = rawText.match(/<title[^>]*>([^<]+)<\/title>/i);
      const pageTitle = titleMatch ? titleMatch[1].trim() : fetchTargetUrl.toString();

      let finalHtml: string;
      if (contentType.includes('text/plain')) {
        finalHtml = `<html><head><title>${pageTitle}</title></head><body bgcolor="#ffffff" style="font-family:monospace;padding:16px;"><pre>${rawText
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')}</pre>${getBridgeScript(fetchTargetUrl.toString())}</body></html>`;
      } else {
        finalHtml = sanitizeExternalHtml(rawText, normalizedUrl, liveReason);
      }

      const bytes = Buffer.byteLength(finalHtml, 'utf8');
      const elapsedMs = Math.max(5, Date.now() - startMs);
      recordRequest({
        method: 'GET',
        host,
        path: `${reqPath} [${liveReason}]`,
        status: upstream.status,
        bytes,
        elapsedMs,
        userAgent,
      });

      res.json({
        url: rawUrl,
        normalizedUrl,
        host,
        path: reqPath,
        title: pageTitle,
        status: upstream.status,
        statusText: upstream.statusText || 'OK',
        headers: {
          Server: `Xserver/1.99 Proxy -> ${upstream.headers.get('server') || 'Remote'}`,
          'X-Wayback-Mode': liveReason,
          'Content-Type': contentType,
          'Content-Length': String(bytes),
          'X-Proxied-URL': fetchTargetUrl.toString(),
        },
        bytes,
        elapsedMs,
        contentType,
        isExternal: true,
        isSecure: parsed.protocol === 'https:',
        mode: 'html',
        html: finalHtml,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Network error connecting to remote host.';
      const html = renderNotFoundPage(
        normalizedUrl,
        `Xserver Proxy could not reach ${host}: ${msg}. Try browsing Xserver's local 1999 sites like http://home.netscapeit.com/ or http://geocities.xserver.net/cyberia/99/.`
      );
      const bytes = Buffer.byteLength(html, 'utf8');
      const elapsedMs = Math.max(5, Date.now() - startMs);
      recordRequest({ method: 'GET', host, path: reqPath, status: 502, bytes, elapsedMs, userAgent });
      res.json({
        url: rawUrl,
        normalizedUrl,
        host,
        path: reqPath,
        title: '502 Bad Gateway — Xserver Proxy',
        status: 502,
        statusText: 'Bad Gateway',
        headers: { Server: 'Xserver/1.99 (Unix)', 'Content-Type': 'text/html' },
        bytes,
        elapsedMs,
        contentType: 'text/html',
        isExternal: true,
        isSecure: false,
        mode: 'html',
        html,
      });
    }
  });

  // CGI: GeoCities Guestbook POST
  app.post('/api/xserver/cgi/guestbook', (req: Request, res: Response) => {
    const startMs = Date.now();
    const name = String(req.body?.name || '').trim().slice(0, 48);
    const email = String(req.body?.email || '').trim().slice(0, 64);
    const homepage = String(req.body?.homepage || '').trim().slice(0, 120);
    const message = String(req.body?.message || '').trim().slice(0, 400);

    if (!name || !message) {
      res.status(400).json({ error: 'Name and message are required.' });
      return;
    }

    const now = new Date();
    const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    guestbookEntries.unshift({
      id: `gb-${Date.now()}`,
      name,
      email,
      homepage,
      message,
      createdAt: stamp,
    });

    recordRequest({
      method: 'POST',
      host: 'geocities.xserver.net',
      path: '/cgi-bin/guestbook.cgi',
      status: 200,
      bytes: Buffer.byteLength(message, 'utf8') + 128,
      elapsedMs: Math.max(2, Date.now() - startMs),
      userAgent: 'Mozilla/4.72 [en] (Win98; I; netscapeit)',
    });

    res.json({ ok: true, redirectUrl: 'http://geocities.xserver.net/cyberia/99/?signed=1' });
  });

  // CGI: Slashdot Comment POST
  app.post('/api/xserver/cgi/comment', (req: Request, res: Response) => {
    const startMs = Date.now();
    const storyId = String(req.body?.storyId || '').trim();
    const author = String(req.body?.author || 'Anonymous Coward').trim().slice(0, 40);
    const title = String(req.body?.title || 'Re: Story').trim().slice(0, 80);
    const body = String(req.body?.body || '').trim().slice(0, 500);

    const story = slashdotStories.find((s) => s.id === storyId);
    if (!story || !body) {
      res.status(400).json({ error: 'Valid storyId and comment body are required.' });
      return;
    }

    const now = new Date();
    const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    story.comments.push({
      id: `c-${Date.now()}`,
      author: author || 'Anonymous Coward',
      title: title || 'Re: Story',
      body,
      score: 1,
      createdAt: stamp,
    });

    recordRequest({
      method: 'POST',
      host: 'slashdot.xserver.org',
      path: '/cgi-bin/comment.cgi',
      status: 200,
      bytes: Buffer.byteLength(body, 'utf8') + 140,
      elapsedMs: Math.max(2, Date.now() - startMs),
      userAgent: 'Mozilla/4.72 [en] (Win98; I; netscapeit)',
    });

    res.json({ ok: true, redirectUrl: `http://slashdot.xserver.org/?posted=${encodeURIComponent(story.id)}` });
  });

  // Publish User Page onto Xserver
  app.post('/api/xserver/pages', (req: Request, res: Response) => {
    const startMs = Date.now();
    const rawSlug = String(req.body?.slug || '').trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-');
    const slug = rawSlug.replace(/^-+|-+$/g, '') || `page-${Date.now()}`;
    const title = String(req.body?.title || 'Untitled 1999 Page').trim().slice(0, 80);
    const author = String(req.body?.author || 'Netscapeit User').trim().slice(0, 48);
    const html = String(req.body?.html || '').trim();

    if (!html) {
      res.status(400).json({ error: 'HTML content cannot be empty.' });
      return;
    }

    const existingIdx = userPages.findIndex((p) => p.slug === slug);
    const now = new Date();
    const createdAt = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const pageObj: UserPublishedPage = {
      slug,
      title,
      author,
      html,
      createdAt,
      hits: existingIdx >= 0 ? userPages[existingIdx].hits : 0,
    };

    if (existingIdx >= 0) {
      userPages[existingIdx] = pageObj;
    } else {
      userPages.unshift(pageObj);
    }

    recordRequest({
      method: 'POST',
      host: 'webmaster.xserver.local',
      path: `/publish/${slug}.html`,
      status: 201,
      bytes: Buffer.byteLength(html, 'utf8'),
      elapsedMs: Math.max(2, Date.now() - startMs),
      userAgent: 'netscapeit-Composer/4.72',
    });

    res.status(201).json({
      ok: true,
      url: `http://xserver.local/pages/${encodeURIComponent(slug)}`,
      page: pageObj,
    });
  });

  // Xserver Status & Live Logs API
  app.get('/api/xserver/status', (_req: Request, res: Response) => {
    const uptimeSeconds = Math.floor((Date.now() - startedAt) / 1000);
    res.json({
      serverName: 'Xserver',
      version: '1.99',
      protocol: 'HTTP/1.0 (Netscape-Enterprise Compatible)',
      uptimeSeconds,
      totalRequests,
      totalBytesServed,
      virtualHosts: [
        {
          host: 'home.netscapeit.com',
          defaultUrl: 'http://home.netscapeit.com/',
          description: 'Netscapeit Netcenter 1999 Portal',
          hits: hostHits['home.netscapeit.com'] || 0,
          cgiScripts: ['/cgi-bin/counter.cgi'],
        },
        {
          host: 'youtube.xserver.net',
          defaultUrl: 'http://youtube.xserver.net/',
          description: 'YouTube 1999 Video Gateway & Player',
          hits: hostHits['youtube.xserver.net'] || 0,
          cgiScripts: ['/api/xserver/browse?url=youtube.com'],
        },
        {
          host: 'altavista.xserver.net',
          defaultUrl: 'http://altavista.xserver.net/',
          description: 'AltaVista Index & Live Web Search',
          hits: hostHits['altavista.xserver.net'] || 0,
          cgiScripts: ['/cgi-bin/search.cgi'],
        },
        {
          host: 'geocities.xserver.net',
          defaultUrl: 'http://geocities.xserver.net/cyberia/99/',
          description: "Cyberia '99 GeoCities Homepage",
          hits: hostHits['geocities.xserver.net'] || 0,
          cgiScripts: ['/cgi-bin/guestbook.cgi', '/cgi-bin/counter.cgi'],
        },
        {
          host: 'slashdot.xserver.org',
          defaultUrl: 'http://slashdot.xserver.org/',
          description: "Slashdot '99 Tech News & Comments",
          hits: hostHits['slashdot.xserver.org'] || 0,
          cgiScripts: ['/cgi-bin/comment.cgi'],
        },
        {
          host: 'winamp.xserver.com',
          defaultUrl: 'http://winamp.xserver.com/',
          description: '1999 Shareware & MIDI Vault',
          hits: hostHits['winamp.xserver.com'] || 0,
          cgiScripts: ['/cgi-bin/archive.cgi'],
        },
        {
          host: 'spacejam.xserver.org',
          defaultUrl: 'http://spacejam.xserver.org/',
          description: 'Planet 1999 WebRing Directory',
          hits: hostHits['spacejam.xserver.org'] || 0,
          cgiScripts: [],
        },
        {
          host: 'xserver.local',
          defaultUrl: 'http://xserver.local/',
          description: 'Xserver Control Console & Member Pages',
          hits: hostHits['xserver.local'] || 0,
          cgiScripts: ['/api/xserver/status', '/api/xserver/pages'],
        },
        {
          host: 'webmaster.xserver.local',
          defaultUrl: 'http://webmaster.xserver.local/builder.html',
          description: 'Netscapeit Composer Publishing Studio',
          hits: hostHits['webmaster.xserver.local'] || 0,
          cgiScripts: ['/api/xserver/pages'],
        },
      ],
      userPages,
      recentLogs: requestLog,
    });
  });

  app.post('/api/xserver/factory-reset', (_req: Request, res: Response) => {
    totalRequests = 0;
    totalBytesServed = 0;
    requestLog.length = 0;

    Object.keys(hostHits).forEach((k) => {
      delete hostHits[k];
    });
    Object.assign(hostHits, INITIAL_HOST_HITS);

    guestbookEntries.length = 0;
    guestbookEntries.push(...INITIAL_GUESTBOOK_ENTRIES.map((e) => ({ ...e })));

    slashdotStories.forEach((story, idx) => {
      story.comments.length = 0;
      const initialComments = INITIAL_SLASHDOT_COMMENTS[idx] || [];
      story.comments.push(...initialComments.map((c) => ({ ...c })));
    });

    userPages.length = 0;
    userPages.push(...INITIAL_USER_PAGES.map((p) => ({ ...p })));

    res.json({ ok: true });
  });

  // Mount Vite dev middleware or serve static build
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Xserver/1.99 + netscapeit listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start Xserver:', err);
  process.exit(1);
});
