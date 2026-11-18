import React, { useState } from 'react';
import { FileCode2, Globe, UploadCloud } from 'lucide-react';

interface ComposerViewProps {
  onNavigate: (url: string) => void;
}

const TEMPLATES: Record<string, { title: string; slug: string; html: string }> = {
  homepage: {
    title: "My 1999 Cyber Homepage",
    slug: 'my-cyber-page',
    html: `<div style="background:#001a33;color:#e6f2ff;font-family:Verdana,sans-serif;padding:28px;min-height:100%;">
  <center>
    <h1 style="color:#ffcc00;">Welcome to My 1999 Web Corner!</h1>
    <p>Hosted live on <b>Xserver/1.99</b> and built in <b>Netscapeit Composer</b>.</p>
    <hr width="75%" color="#336699">
    <table width="80%" border="1" bordercolor="#336699" cellpadding="12" bgcolor="#002b55">
      <tr>
        <td>
          <h3 style="color:#66ffff;margin-top:0;">Cool Links</h3>
          <ul>
            <li><a href="http://home.netscapeit.com/" style="color:#ffcc00;">Netscapeit Netcenter</a></li>
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
      <td><a href="http://altavista.xserver.net/">AltaVista Xserver Search</a></td>
      <td>Search Engine</td>
    </tr>
    <tr>
      <td><a href="http://spacejam.xserver.org/">Planet 1999 Hub</a></td>
      <td>WebRing Directory</td>
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
    <div className="min-h-full bg-[#e5e7eb] text-[#111827] p-5" style={{ fontFamily: '"Public Sans", Verdana, sans-serif' }}>
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="bg-[#003366] text-white px-4 py-3 border border-[#002244] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <FileCode2 className="w-5 h-5 text-[#ffcc00]" />
            <div>
              <h1 className="text-base font-bold">Netscapeit Composer — HTML Publishing Studio</h1>
              <p className="text-xs text-[#bfd8f2]">Author classic HTML pages and publish them live onto Xserver/1.99</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#bfd8f2]">Templates:</span>
            <button
              type="button"
              onClick={() => applyTemplate('homepage')}
              className="px-2.5 py-1 text-[#111827] netscape-raised-btn cursor-pointer font-medium"
            >
              Cyber Homepage
            </button>
            <button
              type="button"
              onClick={() => applyTemplate('zine')}
              className="px-2.5 py-1 text-[#111827] netscape-raised-btn cursor-pointer font-medium"
            >
              Tech Zine
            </button>
            <button
              type="button"
              onClick={() => applyTemplate('links')}
              className="px-2.5 py-1 text-[#111827] netscape-raised-btn cursor-pointer font-medium"
            >
              Hotlist Table
            </button>
          </div>
        </div>

        {statusMsg && (
          <div
            className={`p-3 border text-xs flex flex-wrap items-center justify-between gap-2 ${
              statusMsg.type === 'ok'
                ? 'bg-[#ecfdf5] border-[#059669] text-[#065f46]'
                : 'bg-[#fef2f2] border-[#dc2626] text-[#991b1b]'
            }`}
          >
            <span className="font-medium">{statusMsg.text}</span>
            {statusMsg.url && (
              <button
                type="button"
                onClick={() => onNavigate(statusMsg.url!)}
                className="px-3 py-1 text-[#111827] netscape-raised-btn font-semibold cursor-pointer inline-flex items-center gap-1"
              >
                <Globe className="w-3.5 h-3.5" />
                Open Page in netscapeit
              </button>
            )}
          </div>
        )}

        <form onSubmit={handlePublish} className="bg-[#d4d0c8] bevel-out p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <label className="block text-xs">
              <span className="font-semibold text-[#111827] block mb-1">Page Title</span>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-2 py-1.5 bg-white bevel-in-sm text-xs focus:outline-none"
              />
            </label>
            <label className="block text-xs">
              <span className="font-semibold text-[#111827] block mb-1">Xserver URL Slug</span>
              <div className="flex items-center bg-white bevel-in-sm">
                <span className="px-2 text-[11px] text-[#4b5563] font-mono-retro shrink-0">/pages/</span>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full py-1.5 pr-2 text-xs font-mono-retro focus:outline-none"
                />
              </div>
            </label>
            <label className="block text-xs">
              <span className="font-semibold text-[#111827] block mb-1">Author Handle</span>
              <input
                type="text"
                required
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full px-2 py-1.5 bg-white bevel-in-sm text-xs focus:outline-none"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-[#111827] mb-1">HTML Markup Source</span>
              <textarea
                value={html}
                onChange={(e) => setHtml(e.target.value)}
                rows={15}
                className="w-full p-2.5 bg-white bevel-in text-xs font-mono-retro leading-relaxed focus:outline-none resize-y"
              />
            </div>

            <div className="flex flex-col">
              <span className="text-xs font-semibold text-[#111827] mb-1">Live WYSIWYG Preview</span>
              <iframe
                title="Composer Live Preview"
                sandbox=""
                srcDoc={html}
                className="w-full flex-1 min-h-[280px] bg-white bevel-in"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-[#374151]">
              Target URL: <code className="font-mono-retro">http://xserver.local/pages/{slug || 'untitled'}</code>
            </span>
            <button
              type="submit"
              disabled={publishing}
              className="px-4 py-1.5 text-xs font-bold text-[#111827] netscape-raised-btn cursor-pointer inline-flex items-center gap-1.5"
            >
              <UploadCloud className="w-4 h-4 text-[#003366]" />
              {publishing ? 'Uploading to Xserver...' : 'Publish to Xserver'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
