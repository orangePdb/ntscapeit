import { getBridgeScript } from './sites.ts';

export interface YouTubeVideoItem {
  videoId: string;
  title: string;
  channel: string;
  duration: string;
  views: string;
  published: string;
  thumbnail: string;
}

export interface YouTubeVideoDetail {
  videoId: string;
  title: string;
  authorName: string;
  authorUrl: string;
  thumbnailUrl: string;
  description: string;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function isYouTubeUrl(url: URL): boolean {
  const host = url.hostname.toLowerCase();
  return (
    host === 'youtube.com' ||
    host === 'www.youtube.com' ||
    host === 'm.youtube.com' ||
    host === 'youtu.be' ||
    host === 'youtube.xserver.net'
  );
}

export function extractYouTubeVideoId(url: URL): string | null {
  const host = url.hostname.toLowerCase();
  if (host === 'youtu.be') {
    const id = url.pathname.replace(/^\/+/, '').split('/')[0] || '';
    return /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
  }

  const v = url.searchParams.get('v');
  if (v && /^[A-Za-z0-9_-]{11}$/.test(v)) {
    return v;
  }

  const match = url.pathname.match(/\/(?:embed|shorts|v)\/([A-Za-z0-9_-]{11})/);
  return match ? match[1] : null;
}

export async function fetchYouTubeVideoDetail(videoId: string): Promise<YouTubeVideoDetail> {
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(watchUrl)}&format=json`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 7000);

  let title = `YouTube Video (${videoId})`;
  let authorName = 'YouTube Creator';
  let authorUrl = 'https://www.youtube.com/';
  let thumbnailUrl = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
  let description = '';

  try {
    const oembedRes = await fetch(oembedUrl, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Xserver/1.99)' },
    });
    if (oembedRes.ok) {
      const data = (await oembedRes.json()) as {
        title?: string;
        author_name?: string;
        author_url?: string;
        thumbnail_url?: string;
      };
      if (data.title) title = data.title;
      if (data.author_name) authorName = data.author_name;
      if (data.author_url) authorUrl = data.author_url;
      if (data.thumbnail_url) thumbnailUrl = data.thumbnail_url;
    }

    // Best-effort watch page meta description
    const watchRes = await fetch(watchUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
    if (watchRes.ok) {
      const html = await watchRes.text();
      const descMatch = html.match(/<meta\s+name="description"\s+content="([^"]*)"/i);
      if (descMatch && descMatch[1]) {
        description = descMatch[1]
          .replace(/&amp;/g, '&')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'");
      }
    }
  } finally {
    clearTimeout(timer);
  }

  return {
    videoId,
    title,
    authorName,
    authorUrl,
    thumbnailUrl,
    description,
  };
}

function collectVideoRenderers(node: unknown, out: YouTubeVideoItem[]): void {
  if (!node || typeof node !== 'object' || out.length >= 12) return;
  if (Array.isArray(node)) {
    for (const item of node) {
      collectVideoRenderers(item, out);
      if (out.length >= 12) break;
    }
    return;
  }

  const rec = node as Record<string, unknown>;
  if (rec.videoRenderer && typeof rec.videoRenderer === 'object') {
    const vr = rec.videoRenderer as Record<string, unknown>;
    const videoId = typeof vr.videoId === 'string' ? vr.videoId : '';
    if (/^[A-Za-z0-9_-]{11}$/.test(videoId)) {
      const titleRuns = (vr.title as { runs?: Array<{ text?: string }> } | undefined)?.runs;
      const title =
        titleRuns?.map((r) => r.text || '').join('') ||
        (vr.title as { simpleText?: string } | undefined)?.simpleText ||
        videoId;

      const ownerRuns = (vr.ownerText as { runs?: Array<{ text?: string }> } | undefined)?.runs;
      const channel = ownerRuns?.map((r) => r.text || '').join('') || 'YouTube';

      const duration =
        (vr.lengthText as { simpleText?: string } | undefined)?.simpleText || 'Video';
      const views =
        (vr.shortViewCountText as { simpleText?: string } | undefined)?.simpleText ||
        (vr.viewCountText as { simpleText?: string } | undefined)?.simpleText ||
        '';
      const published =
        (vr.publishedTimeText as { simpleText?: string } | undefined)?.simpleText || '';

      out.push({
        videoId,
        title,
        channel,
        duration,
        views,
        published,
        thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      });
    }
  }

  for (const val of Object.values(rec)) {
    if (val && typeof val === 'object') {
      collectVideoRenderers(val, out);
      if (out.length >= 12) break;
    }
  }
}

export async function searchYouTubeVideos(query: string): Promise<YouTubeVideoItem[]> {
  const q = query.trim() || 'netscape navigator 1999';
  const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 7500);

  try {
    const res = await fetch(searchUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
    if (!res.ok) {
      throw new Error(`YouTube returned HTTP ${res.status}`);
    }
    const html = await res.text();
    const match = html.match(/var\s+ytInitialData\s*=\s*(\{[\s\S]*?\});\s*<\/script>/);
    if (!match || !match[1]) {
      return [];
    }
    const parsed = JSON.parse(match[1]) as unknown;
    const results: YouTubeVideoItem[] = [];
    collectVideoRenderers(parsed, results);
    return results;
  } finally {
    clearTimeout(timer);
  }
}

export function renderYouTube1999Page(opts: {
  baseUrl: string;
  query: string;
  video?: YouTubeVideoDetail | null;
  results: YouTubeVideoItem[];
  errorMsg?: string;
}): string {
  const { baseUrl, query, video, results, errorMsg } = opts;
  const qEsc = escapeHtml(query);

  const playerBlock = video
    ? `<table width="100%" border="1" bordercolor="#808080" cellpadding="8" cellspacing="0" bgcolor="#d4d0c8">
        <tr>
          <td bgcolor="#000080" style="padding:4px 8px;">
            <font color="#ffffff" size="2"><b>Netscape Navigator 4.72 Media Player &mdash; ${escapeHtml(video.title)}</b></font>
          </td>
        </tr>
        <tr>
          <td bgcolor="#000000" align="center" style="padding:8px;">
            <iframe
              width="640"
              height="360"
              src="https://www.youtube-nocookie.com/embed/${video.videoId}"
              title="${escapeHtml(video.title)}"
              frameborder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen
              style="max-width:100%;border:2px inset #808080;background:#000000;"
            ></iframe>
          </td>
        </tr>
        <tr>
          <td bgcolor="#f4f4f4" style="padding:8px;">
            <font size="3"><b>${escapeHtml(video.title)}</b></font><br>
            <font size="2" color="#333333">
              Channel: <b>${escapeHtml(video.authorName)}</b> &nbsp;|&nbsp;
              Video ID: <code>${video.videoId}</code> &nbsp;|&nbsp;
              <a href="https://www.youtube.com/watch?v=${video.videoId}">Reload in Navigator</a>
            </font>
            ${
              video.description
                ? `<p style="margin:8px 0 0 0;font-size:12px;color:#222222;line-height:1.45;">${escapeHtml(video.description)}</p>`
                : ''
            }
          </td>
        </tr>
      </table><br>`
    : '';

  const resultRows =
    results.length > 0
      ? results
          .map(
            (r) => `<tr>
              <td width="150" valign="top" bgcolor="#f9f9f9" style="border-bottom:1px solid #cccccc;padding:8px;">
                <a href="https://www.youtube.com/watch?v=${r.videoId}">
                  <img src="${escapeHtml(r.thumbnail)}" width="144" height="108" alt="${escapeHtml(r.title)}" style="display:block;border:1px solid #666666;" />
                </a>
              </td>
              <td valign="top" bgcolor="#ffffff" style="border-bottom:1px solid #cccccc;padding:8px;">
                <a href="https://www.youtube.com/watch?v=${r.videoId}"><font size="3"><b>${escapeHtml(r.title)}</b></font></a><br>
                <font size="2" color="#006600">${escapeHtml(r.channel)}</font><br>
                <font size="1" color="#555555">
                  Length: <b>${escapeHtml(r.duration)}</b>
                  ${r.views ? ` &middot; ${escapeHtml(r.views)}` : ''}
                  ${r.published ? ` &middot; ${escapeHtml(r.published)}` : ''}
                </font><br><br>
                <a href="https://www.youtube.com/watch?v=${r.videoId}"><font size="2"><b>[ Play in Netscape Media Frame ]</b></font></a>
              </td>
            </tr>`
          )
          .join('')
      : `<tr><td colspan="2" bgcolor="#ffffff" style="padding:12px;"><font size="2">No matching YouTube videos returned. Try searching above (e.g. <code>netscape 1999</code>, <code>me at the zoo</code>, or paste any <code>youtube.com/watch?v=...</code> URL).</font></td></tr>`;

  return `<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<html>
<head>
  <title>${video ? `${escapeHtml(video.title)} — YouTube 1999` : `YouTube 1999 Gateway — Xserver`}</title>
  <style>
    body { margin: 0; padding: 0; background: #ffffff; color: #000000; font-family: Arial, Helvetica, sans-serif; font-size: 13px; }
    a { color: #0000cc; }
    a:visited { color: #660099; }
  </style>
</head>
<body>
  <table width="100%" border="0" cellpadding="8" cellspacing="0" bgcolor="#cc0000">
    <tr>
      <td>
        <font size="5" color="#ffffff" face="Verdana, sans-serif"><b>YouTube</b></font>
        <font size="2" color="#ffff99"><b> 1999 Gateway on Xserver</b></font>
      </td>
      <td align="right">
        <font size="2" color="#ffffff">
          <a href="http://home.netscapeit.com/" style="color:#ffffff;">Netcenter Home</a> &nbsp;|&nbsp;
          <a href="http://altavista.xserver.net/" style="color:#ffff99;">AltaVista</a>
        </font>
      </td>
    </tr>
  </table>

  <table width="100%" border="0" cellpadding="8" cellspacing="0" bgcolor="#ececec" style="border-bottom:2px groove #cccccc;">
    <tr>
      <td align="center">
        <form action="http://youtube.xserver.net/results" method="GET" style="margin:0;">
          <b>Search YouTube:</b>
          <input type="text" name="search_query" value="${qEsc}" size="42" placeholder="Search videos or paste youtube.com URL..." style="font-size:12px;padding:2px 4px;border:2px inset #cccccc;background:#ffffff;" />
          <input type="submit" value="Fetch Videos" style="font-size:12px;padding:2px 10px;background:#cccccc;border:2px outset #ffffff;cursor:pointer;" />
          &nbsp;<font size="1">Quick: <a href="https://www.youtube.com/watch?v=jNQXAC9IVRw">Me at the zoo</a> &middot; <a href="http://youtube.xserver.net/results?search_query=netscape+navigator+1999">Netscape 1999</a></font>
        </form>
      </td>
    </tr>
  </table>

  <table width="94%" align="center" border="0" cellpadding="10" cellspacing="0">
    <tr>
      <td>
        ${errorMsg ? `<table width="100%" border="1" bordercolor="#cc0000" cellpadding="8" bgcolor="#fff0f0"><tr><td><font size="2" color="#990000"><b>Xserver YouTube Fetch Notice:</b> ${escapeHtml(errorMsg)}</font></td></tr></table><br>` : ''}
        ${playerBlock}
        <table width="100%" border="1" bordercolor="#999999" cellpadding="0" cellspacing="0">
          <tr>
            <td colspan="2" bgcolor="#003366" style="padding:5px 8px;">
              <font size="2" color="#ffffff"><b>${video ? 'Related / Search Results' : `Live YouTube Results${query ? ` for "${qEsc}"` : ''}`} (${results.length})</b></font>
            </td>
          </tr>
          ${resultRows}
        </table>
      </td>
    </tr>
  </table>
  ${getBridgeScript(baseUrl)}
</body>
</html>`;
}
