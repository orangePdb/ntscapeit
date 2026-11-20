import React, { useState } from 'react';

interface ComposerViewProps {
  onNavigate: (url: string) => void;
}

const TEMPLATES: Record<string, { title: string; slug: string; html: string }> = {
  homepage: {
    title: 'My 1999 Cyber Homepage',
    slug: 'my-cyber-page',
    html: `<div style="background:#001a33;color:#e6f2ff;font-family:Verdana,sans-serif;padding:28px;min-height:100%;">
  <center>
    <h1 style="color:#ffcc00;">Welcome to My 1999 Web Corner!</h1>
    <p>Hosted live on <b>Xserver/1.99</b> and built in <b>Netscape Composer 4.72</b>.</p>
    <hr width="75%" color="#336699">
    <table width="80%" border="1" bordercolor="#336699" cellpadding="12" bgcolor="#002b55">
      <tr>
        <td>
          <h3 style="color:#66ffff;margin-top:0;">Cool Links</h3>
          <ul>
            <li><a href="http://home.netscapeit.com/" style="color:#ffcc00;">Netscapeit Netcenter</a></li>
            <li><a href="http://youtube.xserver.net/" style="color:#ffcc00;">YouTube 1999 Gateway</a></li>
            <li><a href="http://geocities.xserver.net/cyberia/99/" style="color:#ffcc00;">Cyberia '99 GeoCities</a></li>
            <li><a href="http://winamp.xserver.com/" style="color:#ffcc00;">Winamp &amp; Shareware Vault</a></li>
          </ul>
        </td>
      </tr>
    </table>
  </center>
</div>`,
  },
  zine: {
    title: 'Retro Tech Zine Issue #1',
    slug: 'retro-tech-zine',
    html: `<div style="background:#fffdf5;color:#1a1a1a;font-family:Georgia,serif;padding:32px;max-width:740px;margin:0 auto;">
  <h1 style="border-bottom:3px double #000000;padding-bottom:8px;">THE 1999 WEB DISPATCH</h1>
  <p style="font-size:13px;color:#555555;">Published via Xserver/1.99 &middot; Issue No. 1</p>
  <p style="line-height:1.7;">
    Why do classic 1999 web portals feel so alive? Because every page is handcrafted HTML, fast over 56k dial-up, and connected through personal guestbooks and WebRings.
  </p>
  <p><a href="http://slashdot.xserver.org/">Read today's tech stories on Slashdot '99 &rarr;</a></p>
</div>`,
  },
  links: {
    title: 'Webmaster Hotlist 1999',
    slug: 'hotlist-99',
    html: `<div style="background:#f3f4f6;color:#111827;font-family:Arial,sans-serif;padding:24px;">
  <h2 style="color:#003366;">Webmaster Hotlist</h2>
  <table width="100%" border="1" bordercolor="#9ca3af" cellpadding="8" cellspacing="0" bgcolor="#ffffff">
    <tr bgcolor="#003366" style="color:#ffffff;">
      <th align="left">Site</th>
      <th align="left">Category</th>
    </tr>
    <tr>
      <td><a href="http://youtube.xserver.net/">YouTube 1999 Gateway</a></td>
      <td>Streaming Video</td>
    </tr>
    <tr>
      <td><a href="http://altavista.xserver.net/">AltaVista Xserver Search</a></td>
      <td>Search Engine</td>
    </tr>
    <tr>
      <td><a href="http://xserver.local/">Xserver Console</a></td>
      <td>Server Monitor</td>
    </tr>
  </table>
</div>`,
  },
};

export const ComposerView: React.FC<ComposerViewProps> = ({ onNavigate }) => {
  const [title, setTitle] = useState(TEMPLATES.homepage.title);
  const [slug, setSlug] = useState(TEMPLATES.homepage.slug);
  const [author, setAuthor] = useState('Webmaster99');
  const [html, setHtml] = useState(TEMPLATES.homepage.html);
  const [publishing, setPublishing] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'ok' | 'err'; text: string; url?: string } | null>(null);

  const applyTemplate = (key: keyof typeof TEMPLATES) => {
    const t = TEMPLATES[key];
    setTitle(t.title);
    setSlug(t.slug);
    setHtml(t.html);
    setStatusMsg(null);
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    setPublishing(true);
    setStatusMsg(null);
    try {
      const res = await fetch('/api/xserver/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, slug, author, html }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      setStatusMsg({
        type: 'ok',
        text: `Published to Xserver at ${data.url}`,
        url: data.url,
      });
    } catch (err) {
      setStatusMsg({
        type: 'err',
        text: err instanceof Error ? err.message : 'Failed to publish page',
      });
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="min-h-full bg-[#c0c0c0] text-[#000000] p-4" style={{ fontFamily: '"MS Sans Serif", Tahoma, sans-serif' }}>
      <div className="max-w-6xl mx-auto space-y-3">
        <table className="w-full border-collapse border border-[#003366]">
          <tbody>
            <tr className="bg-[#003366] text-white">
              <td className="p-2.5">
                <div className="text-sm font-bold">Netscape Composer 4.72 — HTML Page Publisher</div>
                <div className="text-xs text-[#ccccff]">Edit HTML 4.0 markup and publish directly onto Xserver/1.99</div>
              </td>
              <td className="p-2.5 text-right text-xs whitespace-nowrap">
                <span className="mr-2">Templates:</span>
                <button
                  type="button"
                  onClick={() => applyTemplate('homepage')}
                  className="px-2 py-0.5 text-black netscape-raised-btn cursor-pointer mr-1"
                >
                  Cyber Homepage
                </button>
                <button
                  type="button"
                  onClick={() => applyTemplate('zine')}
                  className="px-2 py-0.5 text-black netscape-raised-btn cursor-pointer mr-1"
                >
                  Tech Zine
                </button>
                <button
                  type="button"
                  onClick={() => applyTemplate('links')}
                  className="px-2 py-0.5 text-black netscape-raised-btn cursor-pointer"
                >
                  Hotlist
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        {statusMsg && (
          <div
            className={`p-2 border text-xs flex flex-wrap items-center justify-between gap-2 ${
              statusMsg.type === 'ok'
                ? 'bg-[#e6ffed] border-[#008040] text-[#004d26]'
                : 'bg-[#fff0f0] border-[#cc0000] text-[#990000]'
            }`}
          >
            <span><b>{statusMsg.type === 'ok' ? 'Published:' : 'Error:'}</b> {statusMsg.text}</span>
            {statusMsg.url && (
              <button
                type="button"
                onClick={() => onNavigate(statusMsg.url!)}
                className="px-2.5 py-0.5 text-black netscape-raised-btn font-bold cursor-pointer"
              >
                Open in Navigator
              </button>
            )}
          </div>
        )}

        <form onSubmit={handlePublish} className="bg-[#c0c0c0] bevel-out p-3 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <label className="block">
              <span className="font-bold block mb-1">Page Title:</span>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-2 py-1 bg-white bevel-in-sm text-xs focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="font-bold block mb-1">Xserver URL Slug:</span>
              <div className="flex items-center bg-white bevel-in-sm">
                <span className="px-1.5 text-[11px] text-[#555555] font-mono-retro shrink-0">/pages/</span>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full py-1 pr-2 text-xs font-mono-retro focus:outline-none"
                />
              </div>
            </label>
            <label className="block">
              <span className="font-bold block mb-1">Author Handle:</span>
              <input
                type="text"
                required
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full px-2 py-1 bg-white bevel-in-sm text-xs focus:outline-none"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div className="flex flex-col">
              <span className="text-xs font-bold mb-1">HTML Source:</span>
              <textarea
                value={html}
                onChange={(e) => setHtml(e.target.value)}
                rows={15}
                className="w-full p-2 bg-white bevel-in text-xs font-mono-retro leading-normal focus:outline-none resize-y"
              />
            </div>

            <div className="flex flex-col">
              <span className="text-xs font-bold mb-1">Navigator Preview:</span>
              <iframe
                title="Composer Live Preview"
                sandbox=""
                srcDoc={html}
                className="w-full flex-1 min-h-[260px] bg-white bevel-in"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 text-xs">
            <span>
              Target URL: <code className="font-mono-retro">http://xserver.local/pages/{slug || 'untitled'}</code>
            </span>
            <button
              type="submit"
              disabled={publishing}
              className="px-4 py-1 font-bold text-black netscape-raised-btn cursor-pointer"
            >
              {publishing ? 'Publishing...' : 'Publish to Xserver'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
