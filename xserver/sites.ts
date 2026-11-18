export interface GuestbookEntry {
  id: string;
  name: string;
  email: string;
  homepage: string;
  message: string;
  createdAt: string;
}

export interface SlashdotComment {
  id: string;
  author: string;
  title: string;
  body: string;
  score: number;
  createdAt: string;
}

export interface SlashdotStory {
  id: string;
  title: string;
  author: string;
  topic: string;
  postedAt: string;
  summary: string;
  comments: SlashdotComment[];
}

export interface UserPublishedPage {
  slug: string;
  title: string;
  author: string;
  html: string;
  createdAt: string;
  hits: number;
}

export interface SearchableDoc {
  url: string;
  title: string;
  host: string;
  snippet: string;
  keywords: string;
  bytes: number;
  modified: string;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function getBridgeScript(baseUrl: string): string {
  return `
<script>
(function() {
  var currentUrl = ${JSON.stringify(baseUrl)};
  document.addEventListener('click', function(e) {
    var el = e.target;
    while (el && el.tagName !== 'A' && el.tagName !== 'BUTTON') {
      el = el.parentElement;
    }
    if (!el) return;

    if (el.dataset && el.dataset.audio) {
      e.preventDefault();
      window.parent.postMessage({ type: 'netscapeit:audio', track: el.dataset.audio }, '*');
      return;
    }

    if (el.dataset && el.dataset.download) {
      e.preventDefault();
      window.parent.postMessage({
        type: 'netscapeit:download',
        filename: el.dataset.download,
        sizeKb: Number(el.dataset.size || 128),
        url: currentUrl
      }, '*');
      return;
    }

    if (el.tagName === 'A') {
      var href = el.getAttribute('href');
      if (!href || href.startsWith('#')) return;
      e.preventDefault();
      var resolved = href;
      try {
        if (!href.startsWith('http://') && !href.startsWith('https://') && !href.startsWith('about:')) {
          resolved = new URL(href, currentUrl).toString();
        }
      } catch (err) {}
      window.parent.postMessage({ type: 'netscapeit:navigate', url: resolved }, '*');
    }
  });

  document.addEventListener('submit', function(e) {
    var form = e.target;
    if (!form || form.tagName !== 'FORM') return;
    e.preventDefault();
    var action = form.getAttribute('action') || currentUrl;
    var method = (form.getAttribute('method') || 'GET').toUpperCase();
    var fd = new FormData(form);
    var data = {};
    fd.forEach(function(val, key) {
      data[key] = String(val);
    });
    window.parent.postMessage({
      type: 'netscapeit:form',
      action: action,
      method: method,
      data: data,
      currentUrl: currentUrl
    }, '*');
  });
})();
</script>`;
}

export function renderNetcenterPage(opts: {
  origin: string;
  hits: number;
  userPages: UserPublishedPage[];
}): string {
  const { origin, hits, userPages } = opts;
  const imgUrl = `${origin}/src/assets/images/retro_netcenter_desk_1795023274734.jpg`;
  const paddedHits = String(hits).padStart(6, '0');

  const memberLinks =
    userPages.length > 0
      ? userPages
          .map(
            (p) =>
              `<li><a href="http://xserver.local/pages/${encodeURIComponent(p.slug)}">${escapeHtml(p.title)}</a> <font size="1" color="#555555">by ${escapeHtml(p.author)} (${p.hits} hits)</font></li>`
          )
          .join('')
      : `<li><font size="2" color="#555555">No custom pages published yet. <a href="http://webmaster.xserver.local/builder.html">Create one in Composer!</a></font></li>`;

  return `<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<html>
<head>
  <title>Netscapeit Netcenter — Welcome to the 1999 Web</title>
  <style>
    body { margin: 0; padding: 0; background: #ffffff; color: #000000; font-family: Verdana, Geneva, Arial, sans-serif; font-size: 13px; }
    a { color: #0000cc; }
    a:visited { color: #660099; }
    a:hover { color: #cc0000; }
    table { font-size: 13px; }
    .hdr { background: #003366; color: #ffffff; font-weight: bold; }
    .subhdr { background: #336699; color: #ffffff; font-weight: bold; }
    .box { border: 1px solid #999999; background: #f4f6f8; }
    .counter { background: #000000; color: #00ff66; font-family: "Courier New", monospace; font-weight: bold; padding: 2px 6px; border: 2px inset #666666; letter-spacing: 2px; }
  </style>
</head>
<body>
  <table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#003366">
    <tr>
      <td width="16">&nbsp;</td>
      <td height="54" valign="middle">
        <font face="Georgia, Times New Roman, serif" size="5" color="#ffffff"><b>netscapeit</b></font>
        <font size="2" color="#ffcc00"><b> NETCENTER</b></font>
        <font size="1" color="#99ccff">&nbsp;|&nbsp;Served by Xserver/1.99</font>
      </td>
      <td align="right" valign="middle">
        <font size="2" color="#ffffff">
          <a href="http://xserver.local/" style="color:#ffcc00;">Xserver Console</a> &nbsp;|&nbsp;
          <a href="http://webmaster.xserver.local/builder.html" style="color:#ffffff;">Netscapeit Composer</a> &nbsp;|&nbsp;
          <a href="http://spacejam.xserver.org/" style="color:#ffffff;">WebRing Hub</a>
        </font>
      </td>
      <td width="16">&nbsp;</td>
    </tr>
  </table>

  <table width="100%" border="0" cellpadding="6" cellspacing="0" bgcolor="#e5ecf4">
    <tr>
      <td align="center">
        <form action="http://altavista.xserver.net/" method="GET" style="margin:0;">
          <b>Search the Web:</b>
          <input type="text" name="q" size="38" placeholder="Try: mozilla, y2k, cyberia, linux..." style="font-family:Verdana;font-size:12px;padding:2px 4px;border:2px inset #cccccc;background:#ffffff;" />
          <input type="submit" value="Search with AltaVista" style="font-family:Verdana;font-size:12px;padding:2px 10px;background:#cccccc;border:2px outset #ffffff;cursor:pointer;" />
          &nbsp;<font size="1"><a href="http://altavista.xserver.net/">Advanced Search</a></font>
        </form>
      </td>
    </tr>
  </table>

  <table width="96%" align="center" border="0" cellpadding="8" cellspacing="10">
    <tr valign="top">
      <!-- Left Column: Channels -->
      <td width="23%" class="box">
        <table width="100%" border="0" cellpadding="4" cellspacing="0">
          <tr><td class="subhdr"><font size="2">NETCENTER CHANNELS</font></td></tr>
          <tr>
            <td>
              <p style="margin:6px 0;"><b><a href="http://altavista.xserver.net/">Search &amp; Directory</a></b><br><font size="1" color="#444444">AltaVista index on Xserver</font></p>
              <p style="margin:6px 0;"><b><a href="http://slashdot.xserver.org/">Computing &amp; Tech</a></b><br><font size="1" color="#444444">Slashdot '99 news &amp; Y2K desk</font></p>
              <p style="margin:6px 0;"><b><a href="http://geocities.xserver.net/cyberia/99/">Personal Homepages</a></b><br><font size="1" color="#444444">GeoCities Area51 Cyberia '99</font></p>
              <p style="margin:6px 0;"><b><a href="http://winamp.xserver.com/">Shareware &amp; MP3s</a></b><br><font size="1" color="#444444">Winamp 2.22, mIRC &amp; MIDI</font></p>
              <p style="margin:6px 0;"><b><a href="http://spacejam.xserver.org/">Planet 1999 Hub</a></b><br><font size="1" color="#444444">Explore the Xserver WebRing</font></p>
              <hr size="1" noshade color="#cccccc">
              <p style="margin:6px 0;"><b><a href="http://xserver.local/">Xserver 1.99 Admin</a></b><br><font size="1" color="#444444">Live HTTP logs &amp; virtual hosts</font></p>
              <p style="margin:6px 0;"><b><a href="http://webmaster.xserver.local/builder.html">Composer Studio</a></b><br><font size="1" color="#444444">Build &amp; host your own page</font></p>
            </td>
          </tr>
        </table>

        <table width="100%" border="0" cellpadding="4" cellspacing="0" style="margin-top:10px;">
          <tr><td class="hdr"><font size="2">1999 TECH MARKETS</font></td></tr>
          <tr>
            <td bgcolor="#ffffff" style="border:1px solid #cccccc;">
              <table width="100%" border="0" cellpadding="2" cellspacing="0">
                <tr><td><font size="1"><b>NSCP</b></font></td><td align="right"><font size="1" face="Courier New">92.50</font></td><td align="right"><font size="1" color="#008000">+4.25</font></td></tr>
                <tr><td><font size="1"><b>YHOO</b></font></td><td align="right"><font size="1" face="Courier New">184.75</font></td><td align="right"><font size="1" color="#008000">+11.12</font></td></tr>
                <tr><td><font size="1"><b>SUNW</b></font></td><td align="right"><font size="1" face="Courier New">78.38</font></td><td align="right"><font size="1" color="#008000">+2.00</font></td></tr>
                <tr><td><font size="1"><b>AMZN</b></font></td><td align="right"><font size="1" face="Courier New">85.19</font></td><td align="right"><font size="1" color="#cc0000">-1.50</font></td></tr>
                <tr><td><font size="1"><b>SGI</b></font></td><td align="right"><font size="1" face="Courier New">16.25</font></td><td align="right"><font size="1" color="#008000">+0.38</font></td></tr>
              </table>
            </td>
          </tr>
        </table>
      </td>

      <!-- Center Column: Main Feature -->
      <td width="52%">
        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border:1px solid #003366;">
          <tr>
            <td bgcolor="#003366" style="padding:5px 8px;">
              <font size="2" color="#ffffff"><b>SPECIAL REPORT: BROWSING AT THE TURN OF THE MILLENNIUM</b></font>
            </td>
          </tr>
          <tr>
            <td style="padding:10px;" bgcolor="#ffffff">
              <img src="${imgUrl}" width="100%" alt="1999 CRT desktop computer running Netcenter" style="display:block;border:1px solid #999999;margin-bottom:8px;" />
              <font size="3"><b>Welcome to netscapeit on Xserver/1.99</b></font>
              <p style="line-height:1.5;margin-top:6px;">
                Built in the spirit of 1999 Netscape Communicator 4.7, <b>netscapeit</b> connects directly to <b>Xserver</b>—a live HTTP/1.0 virtual hosting engine running Classic portals, CGI guestbooks, AltaVista web search, and real-time HTML publishing.
              </p>
              <p style="line-height:1.5;">
                Try toggling <b>56k V.90 Modem</b> speed under <i>Communicator &rarr; Preferences</i>, inspect raw HTTP packets in <i>View &rarr; Page Source</i>, or type any live URL in the Location bar!
              </p>
            </td>
          </tr>
        </table>

        <table width="100%" border="0" cellpadding="6" cellspacing="0" style="margin-top:12px;border:1px solid #999999;" bgcolor="#fffff0">
          <tr>
            <td bgcolor="#ffcc00" style="padding:4px 8px;">
              <font size="2" color="#000000"><b>WHAT'S COOL ON XSERVER TODAY</b></font>
            </td>
          </tr>
          <tr>
            <td>
              <ul style="margin:6px 0;padding-left:20px;line-height:1.6;">
                <li><a href="http://geocities.xserver.net/cyberia/99/"><b>Cyberia '99 Homepage</b></a> — Sign the real CGI guestbook &amp; ride the WebRing!</li>
                <li><a href="http://slashdot.xserver.org/"><b>Slashdot '99 Tech News</b></a> — Y2K server readiness &amp; Mozilla milestone discussions.</li>
                <li><a href="http://winamp.xserver.com/"><b>Winamp &amp; Shareware Vault</b></a> — Download 1999 classics &amp; play live MIDI tracker audio.</li>
                <li><a href="about:mozilla"><b>The Book of Mozilla</b></a> — Classic Netscape 12:10 browser easter egg.</li>
              </ul>
              <hr size="1" noshade color="#dddddd">
              <font size="2"><b>Member Homepages Hosted on Xserver:</b></font>
              <ul style="margin:4px 0;padding-left:20px;line-height:1.5;">
                ${memberLinks}
              </ul>
            </td>
          </tr>
        </table>
      </td>

      <!-- Right Column: Headlines & Info -->
      <td width="25%" class="box">
        <table width="100%" border="0" cellpadding="4" cellspacing="0">
          <tr><td class="subhdr"><font size="2">TODAY'S HEADLINES</font></td></tr>
          <tr>
            <td>
              <p style="margin:6px 0;"><b>Nov 1999:</b> <a href="http://slashdot.xserver.org/">Xserver/1.99 Passes Full Y2K Leap-Year Clock Audit</a></p>
              <p style="margin:6px 0;"><b>Tech:</b> <a href="http://slashdot.xserver.org/">Open-Source Gecko Layout Engine Reaches M11</a></p>
              <p style="margin:6px 0;"><b>Audio:</b> <a href="http://winamp.xserver.com/">Winamp 2.22 Adds Equalizer Presets &amp; Skins</a></p>
              <p style="margin:6px 0;"><b>Search:</b> <a href="http://altavista.xserver.net/?q=webring">AltaVista Indexes All Xserver User Pages</a></p>
            </td>
          </tr>
        </table>

        <table width="100%" border="0" cellpadding="6" cellspacing="0" style="margin-top:10px;border:1px solid #cccccc;" bgcolor="#ffffff">
          <tr>
            <td align="center">
              <font size="1" color="#444444"><b>XSERVER VISITOR COUNTER</b></font><br><br>
              <span class="counter">${paddedHits}</span><br><br>
              <font size="1" color="#666666">Best viewed with <b>netscapeit 4.7</b><br>at 800x600 or higher.</font>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>

  <center>
    <hr width="96%" size="1" noshade color="#cccccc">
    <font size="1" color="#555555">
      Copyright &copy; 1999 netscapeit &amp; Xserver Communications Corp. &nbsp;|&nbsp;
      <a href="http://xserver.local/">Server Status</a> &nbsp;|&nbsp;
      <a href="about:netscapeit">About netscapeit</a>
    </font>
    <br><br>
  </center>
</body>
</html>`;
}

export function renderAltaVistaPage(opts: {
  query: string;
  results: SearchableDoc[];
}): string {
  const { query, results } = opts;
  const qEsc = escapeHtml(query);

  const resultsHtml =
    query.trim() === ''
      ? `<p><font size="2" color="#333333">Enter keywords above to search all virtual hosts and member pages currently hosted on <b>Xserver/1.99</b>.</font></p>
         <p><font size="2">Popular queries: <a href="http://altavista.xserver.net/?q=mozilla">mozilla</a> &middot; <a href="http://altavista.xserver.net/?q=y2k">y2k</a> &middot; <a href="http://altavista.xserver.net/?q=winamp">winamp</a> &middot; <a href="http://altavista.xserver.net/?q=guestbook">guestbook</a></font></p>`
      : results.length === 0
      ? `<p><font size="2" color="#990000"><b>No documents matched "${qEsc}".</b></font></p><p><font size="2">Try broader keywords or <a href="http://webmaster.xserver.local/builder.html">publish a new page on Xserver</a>.</font></p>`
      : `<p><font size="2" color="#006600">AltaVista on Xserver found <b>${results.length}</b> matching web page(s) for <b>"${qEsc}"</b>:</font></p>
         <ol style="line-height:1.55;">
           ${results
             .map(
               (r) => `<li style="margin-bottom:12px;">
                 <a href="${escapeHtml(r.url)}"><font size="3"><b>${escapeHtml(r.title)}</b></font></a><br>
                 <font size="2">${escapeHtml(r.snippet)}</font><br>
                 <font size="1" color="#008000">${escapeHtml(r.url)}</font>
                 <font size="1" color="#666666"> &mdash; size ${(r.bytes / 1024).toFixed(1)}K &middot; Last modified ${escapeHtml(r.modified)}</font>
               </li>`
             )
             .join('')}
         </ol>`;

  return `<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<html>
<head>
  <title>AltaVista Xserver Search${query ? `: ${qEsc}` : ''}</title>
  <style>
    body { background: #ffffff; color: #000000; font-family: Arial, Helvetica, sans-serif; font-size: 13px; margin: 16px; }
    a { color: #0000cc; }
    a:visited { color: #660099; }
  </style>
</head>
<body>
  <table width="100%" border="0" cellpadding="8" cellspacing="0" bgcolor="#004a8f">
    <tr>
      <td>
        <font size="5" color="#ffffff" face="Verdana, sans-serif"><b>AltaVista</b></font>
        <font size="2" color="#ffcc00"><b> Xserver Edition</b></font>
      </td>
      <td align="right">
        <a href="http://home.netscapeit.com/" style="color:#ffffff;font-size:12px;">&laquo; Back to Netcenter</a>
      </td>
    </tr>
  </table>

  <table width="100%" border="0" cellpadding="12" cellspacing="0" bgcolor="#eeeeee" style="border-bottom:1px solid #cccccc;">
    <tr>
      <td>
        <form action="http://altavista.xserver.net/" method="GET" style="margin:0;">
          <font size="2"><b>Search Xserver Web Index:</b></font><br><br>
          <input type="text" name="q" value="${qEsc}" size="50" style="font-size:13px;padding:3px 5px;border:2px inset #cccccc;background:#ffffff;" />
          <input type="submit" value="Search" style="font-size:13px;padding:3px 14px;background:#cccccc;border:2px outset #ffffff;cursor:pointer;" />
        </form>
      </td>
    </tr>
  </table>

  <div style="margin:16px 4px;max-width:780px;">
    ${resultsHtml}
  </div>
</body>
</html>`;
}

export function renderGeoCitiesPage(opts: {
  origin: string;
  hits: number;
  entries: GuestbookEntry[];
  justSigned?: boolean;
}): string {
  const { origin, hits, entries, justSigned } = opts;
  const imgUrl = `${origin}/src/assets/images/cyberia_99_portal_1795023275146.jpg`;
  const paddedHits = String(hits).padStart(6, '0');

  const entryRows = entries
    .map(
      (e) => `<tr>
        <td bgcolor="#0a1638" style="border:1px solid #336699;padding:8px;">
          <font color="#ffcc00" size="2"><b>${escapeHtml(e.name)}</b></font>
          ${e.email ? `<font size="1" color="#99ccff"> &lt;${escapeHtml(e.email)}&gt;</font>` : ''}
          ${e.homepage ? `<font size="1"> &mdash; <a href="${escapeHtml(e.homepage)}" style="color:#66ffff;">Homepage</a></font>` : ''}
          <font size="1" color="#8899bb"> &middot; ${escapeHtml(e.createdAt)}</font>
          <p style="margin:6px 0 0 0;color:#e6f0ff;font-size:12px;">${escapeHtml(e.message)}</p>
        </td>
      </tr>`
    )
    .join('');

  return `<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<html>
<head>
  <title>~*~ Welcome to Cyberia '99 ~*~ GeoCities Area51</title>
  <style>
    body {
      background-color: #03071e;
      background-image: radial-gradient(#334477 1px, transparent 1px);
      background-size: 28px 28px;
      color: #e0f0ff;
      font-family: "Comic Sans MS", "Trebuchet MS", Verdana, sans-serif;
      font-size: 13px;
      margin: 16px;
    }
    a { color: #66ffff; }
    a:visited { color: #ff99ff; }
    .caution {
      background: repeating-linear-gradient(45deg, #ffcc00, #ffcc00 10px, #111111 10px, #111111 20px);
      height: 10px;
      border: 1px solid #ffcc00;
    }
  </style>
</head>
<body>
  <center>
    <font size="1" color="#99ccff">GeoCities &gt; Area51 &gt; Cyberia &gt; 1999 &nbsp;|&nbsp; Hosted by Xserver/1.99</font><br><br>
    <font size="6" color="#66ffff"><b>~*~ CYBERIA '99 ~*~</b></font><br>
    <font size="2" color="#ffcc00">Webmaster's Personal Corner of the Information Superhighway</font>
    <br><br>
    <table width="85%" border="1" bordercolor="#3366cc" cellpadding="4" cellspacing="0" bgcolor="#000033">
      <tr>
        <td>
          <marquee behavior="scroll" direction="left" scrollamount="4">
            <font color="#00ff99" size="2"><b>WELCOME SURFER! Don't forget to sign the CGI Guestbook below before riding the 1999 WebRing!! Y2K Ready!!</b></font>
          </marquee>
        </td>
      </tr>
    </table>
    <br>
    <table width="85%" border="0" cellpadding="10" cellspacing="0" bgcolor="#07112b" style="border:2px ridge #4477cc;">
      <tr valign="top">
        <td width="46%" align="center">
          <div style="overflow:hidden;border:2px solid #66ffff;max-height:240px;">
            <img src="${imgUrl}" width="100%" alt="Bryce 3D Cyberia landscape" style="display:block;transform:scale(1.14);" />
          </div>
          <font size="1" color="#99ccff"><i>Rendered in Bryce 3D &middot; 1999</i></font>
        </td>
        <td width="54%">
          <font size="3" color="#ffcc00"><b>About This Page</b></font>
          <p style="line-height:1.5;">
            Greetings, netizens! You have reached <b>Cyberia '99</b>, running live on <b>Xserver's CGI-BIN engine</b>. Every time you load this page, Xserver increments the real visitor counter below!
          </p>
          <div class="caution"></div>
          <p style="margin:6px 0;font-size:12px;color:#ffcc00;"><b>UNDER CONSTRUCTION:</b> Still adding MIDI tracks and animated GIFs!</p>
          <div class="caution"></div>
          <p style="margin-top:12px;">
            You are visitor number:<br>
            <span style="display:inline-block;margin-top:4px;background:#000000;color:#00ff66;font-family:'Courier New',monospace;font-size:16px;font-weight:bold;padding:3px 10px;border:2px inset #666666;letter-spacing:3px;">${paddedHits}</span>
          </p>
        </td>
      </tr>
    </table>

    <br>
    <table width="85%" border="0" cellpadding="8" cellspacing="0" bgcolor="#0b1b44" style="border:1px solid #4477cc;">
      <tr>
        <td align="center">
          <font size="2" color="#ffcc00"><b>THE 1999 XSERVER WEBRING</b></font><br><br>
          [ <a href="http://spacejam.xserver.org/">&laquo; Prev Site</a> ] &nbsp;
          [ <a href="http://home.netscapeit.com/">Netcenter Home</a> ] &nbsp;
          [ <a href="http://slashdot.xserver.org/">Slashdot '99</a> ] &nbsp;
          [ <a href="http://winamp.xserver.com/">Next Site &raquo;</a> ]
        </td>
      </tr>
    </table>

    <br>
    <table width="85%" border="0" cellpadding="10" cellspacing="4" bgcolor="#060f26" style="border:2px groove #3366aa;">
      <tr>
        <td>
          <font size="4" color="#66ffff"><b>Sign My CGI Guestbook!</b></font>
          ${justSigned ? `<p style="background:#004422;border:1px solid #00ff88;padding:6px;color:#00ff88;"><b>Thanks for signing! Your message was saved by Xserver /cgi-bin/guestbook.cgi.</b></p>` : ''}
          <form action="http://geocities.xserver.net/cgi-bin/guestbook.cgi" method="POST" style="margin-top:8px;">
            <table border="0" cellpadding="4" cellspacing="0" width="100%">
              <tr>
                <td width="110"><font size="2">Your Name:</font></td>
                <td><input type="text" name="name" required size="28" placeholder="CyberSurfer99" style="background:#ffffff;color:#000000;padding:2px 4px;border:2px inset #999999;" /></td>
              </tr>
              <tr>
                <td><font size="2">Email:</font></td>
                <td><input type="text" name="email" size="28" placeholder="surfer@aol.com" style="background:#ffffff;color:#000000;padding:2px 4px;border:2px inset #999999;" /></td>
              </tr>
              <tr>
                <td><font size="2">Homepage URL:</font></td>
                <td><input type="text" name="homepage" size="28" placeholder="http://home.netscapeit.com/" style="background:#ffffff;color:#000000;padding:2px 4px;border:2px inset #999999;" /></td>
              </tr>
              <tr>
                <td valign="top"><font size="2">Message:</font></td>
                <td><textarea name="message" required rows="3" cols="44" placeholder="Cool site!! Keep it 1999!" style="background:#ffffff;color:#000000;padding:3px 5px;border:2px inset #999999;"></textarea></td>
              </tr>
              <tr>
                <td></td>
                <td><input type="submit" value="Sign Guestbook" style="background:#cccccc;color:#000000;padding:3px 12px;border:2px outset #ffffff;font-weight:bold;cursor:pointer;" /></td>
              </tr>
            </table>
          </form>
        </td>
      </tr>
    </table>

    <br>
    <table width="85%" border="0" cellpadding="4" cellspacing="6">
      <tr><td><font size="3" color="#ffcc00"><b>Recent Guestbook Entries (${entries.length}):</b></font></td></tr>
      ${entryRows}
    </table>
    <br>
  </center>
</body>
</html>`;
}

export function renderSlashdotPage(opts: {
  origin: string;
  stories: SlashdotStory[];
  justPostedStoryId?: string;
}): string {
  const { origin, stories, justPostedStoryId } = opts;
  const imgUrl = `${origin}/src/assets/images/y2k_mainframe_chip_1795023276397.jpg`;

  const storiesHtml = stories
    .map((s, idx) => {
      const commentsHtml = s.comments
        .map(
          (c) => `<div style="background:#ffffff;border:1px solid #cccccc;padding:6px 8px;margin-top:6px;">
            <font size="2" color="#006666"><b>${escapeHtml(c.title)}</b></font>
            <font size="1" color="#555555"> (Score:${c.score}) by <b>${escapeHtml(c.author)}</b> on ${escapeHtml(c.createdAt)}</font>
            <p style="margin:4px 0 0 0;font-size:12px;">${escapeHtml(c.body)}</p>
          </div>`
        )
        .join('');

      return `<table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom:16px;border:1px solid #006666;" bgcolor="#ffffff">
        <tr>
          <td bgcolor="#006666" style="padding:5px 10px;">
            <font size="3" color="#ffffff"><b>${escapeHtml(s.title)}</b></font>
          </td>
        </tr>
        <tr>
          <td bgcolor="#dce8e8" style="padding:4px 10px;">
            <font size="1" color="#222222">Posted by <b>${escapeHtml(s.author)}</b> on ${escapeHtml(s.postedAt)} &middot; Topic: <b>${escapeHtml(s.topic)}</b></font>
          </td>
        </tr>
        <tr>
          <td style="padding:10px;line-height:1.55;">
            ${idx === 0 ? `<img src="${imgUrl}" width="220" align="right" alt="Enterprise Pentium II Xeon server hardware" style="margin:0 0 8px 12px;border:1px solid #888888;" />` : ''}
            <font size="2">${escapeHtml(s.summary)}</font>
            <br clear="all">
            <hr size="1" noshade color="#dddddd" style="margin:10px 0;">
            <font size="2" color="#006666"><b>Comments (${s.comments.length})</b></font>
            ${justPostedStoryId === s.id ? `<div style="background:#e6ffed;border:1px solid #008844;padding:4px 8px;margin-top:4px;font-size:12px;color:#005522;">Comment posted to Xserver!</div>` : ''}
            ${commentsHtml}
            <form action="http://slashdot.xserver.org/cgi-bin/comment.cgi" method="POST" style="margin-top:8px;background:#f4f4f4;padding:8px;border:1px solid #dddddd;">
              <input type="hidden" name="storyId" value="${escapeHtml(s.id)}" />
              <font size="1"><b>Post Comment:</b></font>
              <input type="text" name="author" size="14" placeholder="Handle" required style="font-size:11px;padding:2px;border:1px inset #aaa;" />
              <input type="text" name="title" size="22" placeholder="Subject" required style="font-size:11px;padding:2px;border:1px inset #aaa;" /><br>
              <textarea name="body" rows="2" cols="52" placeholder="Write your reply..." required style="font-size:11px;margin-top:4px;padding:2px;border:1px inset #aaa;"></textarea><br>
              <input type="submit" value="Post Comment" style="margin-top:4px;font-size:11px;padding:2px 8px;background:#cccccc;border:2px outset #ffffff;cursor:pointer;" />
            </form>
          </td>
        </tr>
      </table>`;
    })
    .join('');

  return `<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<html>
<head>
  <title>Slashdot '99 — News for Nerds. Stuff that Matters.</title>
  <style>
    body { background: #e8ecec; color: #000000; font-family: Arial, Helvetica, sans-serif; font-size: 13px; margin: 0; padding: 0; }
    a { color: #005555; }
  </style>
</head>
<body>
  <table width="100%" border="0" cellpadding="8" cellspacing="0" bgcolor="#006666">
    <tr>
      <td>
        <font size="5" color="#ffffff"><b>Slashdot '99</b></font>
        <font size="2" color="#ccffff"> &mdash; News for Nerds. Stuff that Matters.</font>
      </td>
      <td align="right">
        <a href="http://home.netscapeit.com/" style="color:#ffffff;font-size:12px;">Netcenter</a> &nbsp;|&nbsp;
        <a href="http://xserver.local/" style="color:#ccffff;font-size:12px;">Xserver Status</a>
      </td>
    </tr>
  </table>

  <table width="94%" align="center" border="0" cellpadding="8" cellspacing="0" style="margin-top:12px;">
    <tr valign="top">
      <td width="76%">
        ${storiesHtml}
      </td>
      <td width="24%">
        <table width="100%" border="0" cellpadding="6" cellspacing="0" style="border:1px solid #006666;" bgcolor="#ffffff">
          <tr><td bgcolor="#006666"><font size="2" color="#ffffff"><b>Y2K COUNTDOWN</b></font></td></tr>
          <tr>
            <td>
              <font size="2"><b>Xserver/1.99 Status:</b></font><br>
              <font size="2" color="#007700"><b>Y2K COMPLIANT</b></font><br><br>
              <font size="1" color="#444444">All 4-digit year headers verified under HTTP/1.0 RFC 1945.</font>
            </td>
          </tr>
        </table>
        <br>
        <table width="100%" border="0" cellpadding="6" cellspacing="0" style="border:1px solid #006666;" bgcolor="#ffffff">
          <tr><td bgcolor="#006666"><font size="2" color="#ffffff"><b>HOT LINKS</b></font></td></tr>
          <tr>
            <td style="line-height:1.6;">
              <font size="2">
                &bull; <a href="http://winamp.xserver.com/">Winamp 2.22 Vault</a><br>
                &bull; <a href="http://geocities.xserver.net/cyberia/99/">Cyberia '99</a><br>
                &bull; <a href="http://altavista.xserver.net/">AltaVista Search</a><br>
                &bull; <a href="about:mozilla">Book of Mozilla</a>
              </font>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function renderWinampVaultPage(): string {
  return `<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<html>
<head>
  <title>Winamp &amp; 1999 Shareware Vault — Hosted on Xserver</title>
  <style>
    body { background: #1e222a; color: #e2e8f0; font-family: Verdana, Arial, sans-serif; font-size: 13px; margin: 16px; }
    a { color: #66d9ef; }
    th { background: #2c3442; color: #ffd700; text-align: left; }
    td { border-bottom: 1px solid #333c4d; }
    .btn { background: #c0c0c0; color: #000000; border: 2px outset #ffffff; padding: 3px 10px; font-size: 11px; font-weight: bold; cursor: pointer; }
  </style>
</head>
<body>
  <table width="94%" align="center" border="0" cellpadding="10" cellspacing="0" bgcolor="#14171d" style="border:2px ridge #556688;">
    <tr>
      <td>
        <font size="5" color="#ffd700"><b>1999 SHAREWARE &amp; MIDI VAULT</b></font><br>
        <font size="2" color="#99aabb">High-speed T1 &amp; 56k V.90 mirrors served by Xserver/1.99</font>
      </td>
      <td align="right">
        <a href="http://home.netscapeit.com/">Netcenter Home</a> &nbsp;|&nbsp;
        <a href="http://geocities.xserver.net/cyberia/99/">Cyberia '99</a>
      </td>
    </tr>
  </table>

  <br>
  <table width="94%" align="center" border="0" cellpadding="8" cellspacing="0" bgcolor="#191d24" style="border:1px solid #3d485c;">
    <tr>
      <td colspan="5" bgcolor="#263042"><font size="3" color="#ffffff"><b>1999 MIDI / TRACKER JUKEBOX (Web Audio Synth)</b></font></td>
    </tr>
    <tr>
      <td colspan="5">
        <font size="2">Click any track below to synthesize classic 1999 SoundBlaster-style MIDI loops directly inside <b>netscapeit</b>:</font><br><br>
        <button class="btn" data-audio="cyberia">&#9654; Play Cyberia_Starlight.mid</button> &nbsp;
        <button class="btn" data-audio="netscape">&#9654; Play Netscape_Groove.mid</button> &nbsp;
        <button class="btn" data-audio="y2k">&#9654; Play Y2K_Countdown.mid</button> &nbsp;
        <button class="btn" data-audio="stop">&#9632; Stop Audio</button>
      </td>
    </tr>
  </table>

  <br>
  <table width="94%" align="center" border="0" cellpadding="8" cellspacing="0" bgcolor="#191d24" style="border:1px solid #3d485c;">
    <tr>
      <th>Program</th>
      <th>Version</th>
      <th>Size</th>
      <th>Notes</th>
      <th>Download</th>
    </tr>
    <tr>
      <td><b>netscapeit Communicator</b></td>
      <td>4.72</td>
      <td>14,200 KB</td>
      <td>Complete 1999 browser suite with Composer &amp; Xserver tools</td>
      <td><button class="btn" data-download="netscapeit-4.72-readme.txt" data-size="24">Download</button></td>
    </tr>
    <tr>
      <td><b>Winamp</b></td>
      <td>2.22</td>
      <td>1,940 KB</td>
      <td>Nullsoft MP3 &amp; MOD player with classic skin support</td>
      <td><button class="btn" data-download="winamp-2.22-skin-info.txt" data-size="48">Download</button></td>
    </tr>
    <tr>
      <td><b>mIRC</b></td>
      <td>5.6</td>
      <td>980 KB</td>
      <td>IRC chat client for EFnet, Undernet &amp; DALnet</td>
      <td><button class="btn" data-download="mirc-5.6-servers.txt" data-size="16">Download</button></td>
    </tr>
    <tr>
      <td><b>ICQ 99b</b></td>
      <td>Build 2549</td>
      <td>2,810 KB</td>
      <td>Uh-oh! Instant messaging across the 1999 web</td>
      <td><button class="btn" data-download="icq99b-manifest.txt" data-size="32">Download</button></td>
    </tr>
    <tr>
      <td><b>PKZIP</b></td>
      <td>2.70</td>
      <td>640 KB</td>
      <td>Shareware archive utility for Windows 95/98</td>
      <td><button class="btn" data-download="pkzip270-notes.txt" data-size="12">Download</button></td>
    </tr>
  </table>
</body>
</html>`;
}

export function renderSpaceJamHubPage(): string {
  return `<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<html>
<head>
  <title>Planet 1999 — The Xserver WebRing Hub</title>
  <style>
    body {
      background-color: #000000;
      background-image: radial-gradient(#ffffff 1px, transparent 1px), radial-gradient(#88aaff 1px, transparent 1px);
      background-size: 55px 55px, 85px 85px;
      background-position: 0 0, 22px 27px;
      color: #ffffff;
      font-family: "Times New Roman", Times, serif;
      margin: 20px;
    }
    a { color: #ffcc00; text-decoration: underline; }
    a:hover { color: #ff5555; }
    .planet {
      display: inline-block;
      padding: 12px 16px;
      border: 2px outset #6688cc;
      background: #0b1633;
      margin: 6px;
      text-align: center;
      min-width: 150px;
    }
  </style>
</head>
<body>
  <center>
    <font size="6" color="#ff3333"><b>PLANET 1999</b></font><br>
    <font size="3" color="#ffcc00"><i>The Central Xserver Orbital Directory</i></font>
    <br><br>
    <table width="80%" border="0" cellpadding="14" cellspacing="10">
      <tr>
        <td align="center">
          <div class="planet"><a href="http://home.netscapeit.com/"><b>Netcenter Portal</b></a><br><font size="2" color="#aaaaff">Start Page</font></div>
          <div class="planet"><a href="http://altavista.xserver.net/"><b>AltaVista Search</b></a><br><font size="2" color="#aaaaff">Web Index</font></div>
          <div class="planet"><a href="http://geocities.xserver.net/cyberia/99/"><b>Cyberia '99</b></a><br><font size="2" color="#aaaaff">GeoCities + Guestbook</font></div>
        </td>
      </tr>
      <tr>
        <td align="center">
          <div class="planet"><a href="http://slashdot.xserver.org/"><b>Slashdot '99</b></a><br><font size="2" color="#aaaaff">News for Nerds</font></div>
          <div class="planet"><a href="http://winamp.xserver.com/"><b>Shareware Vault</b></a><br><font size="2" color="#aaaaff">MIDI &amp; Downloads</font></div>
          <div class="planet"><a href="http://xserver.local/"><b>Xserver Console</b></a><br><font size="2" color="#aaaaff">HTTP/1.0 Monitor</font></div>
        </td>
      </tr>
      <tr>
        <td align="center">
          <div class="planet"><a href="http://webmaster.xserver.local/builder.html"><b>Netscapeit Composer</b></a><br><font size="2" color="#aaaaff">HTML Page Studio</font></div>
          <div class="planet"><a href="about:mozilla"><b>Book of Mozilla</b></a><br><font size="2" color="#aaaaff">12:10 Easter Egg</font></div>
          <div class="planet"><a href="about:netscapeit"><b>About netscapeit</b></a><br><font size="2" color="#aaaaff">Credits &amp; Specs</font></div>
        </td>
      </tr>
    </table>
    <br>
    <font size="2" color="#8899bb">Orbital Map Powered by Xserver/1.99 Virtual Hosting</font>
  </center>
</body>
</html>`;
}

export function renderUserPage(page: UserPublishedPage): string {
  return `<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<html>
<head>
  <title>${escapeHtml(page.title)} — Hosted on Xserver</title>
</head>
<body>
  <div style="background:#e5e7eb;border-bottom:1px solid #9ca3af;padding:5px 10px;font-family:Verdana,sans-serif;font-size:11px;color:#111827;">
    <b>Xserver Member Page:</b> ${escapeHtml(page.title)} &middot; Author: ${escapeHtml(page.author)} &middot; Hits: ${page.hits} &nbsp;|&nbsp;
    <a href="http://home.netscapeit.com/">Netcenter</a> &middot;
    <a href="http://webmaster.xserver.local/builder.html">Edit in Composer</a>
  </div>
  ${page.html}
</body>
</html>`;
}

export function renderAboutMozilla(): string {
  return `<!DOCTYPE HTML>
<html>
<head><title>The Book of Mozilla</title></head>
<body bgcolor="#800000" text="#ffffff" link="#ffcc00" style="font-family:Georgia, 'Times New Roman', serif;margin:0;padding:48px;">
  <center>
    <table width="600" border="0" cellpadding="24">
      <tr>
        <td align="center">
          <font size="5"><i>And the beast shall come forth surrounded by a roiling cloud of vengeance. The house of the unbelievers shall be razed and they scorched to the earth. Their tags shall blink until the end of days.</i></font>
          <br><br><br>
          <p align="right"><font size="4"><b>from The Book of Mozilla, 12:10</b></font></p>
          <br>
          <font size="2"><a href="http://home.netscapeit.com/">Return to Netscapeit Netcenter</a></font>
        </td>
      </tr>
    </table>
  </center>
</body>
</html>`;
}

export function renderAboutNetscapeit(): string {
  return `<!DOCTYPE HTML>
<html>
<head><title>About netscapeit 4.72 &amp; Xserver/1.99</title></head>
<body bgcolor="#ffffff" text="#000000" style="font-family:Verdana,Arial,sans-serif;margin:28px;">
  <table width="680" align="center" border="1" bordercolor="#003366" cellpadding="16" cellspacing="0">
    <tr>
      <td bgcolor="#003366"><font size="4" color="#ffffff"><b>netscapeit Communicator 4.72</b></font></td>
    </tr>
    <tr>
      <td style="line-height:1.6;">
        <p><b>User-Agent:</b> <code>Mozilla/4.72 [en] (Win98; I; netscapeit)</code></p>
        <p><b>Origin Server:</b> <code>Xserver/1.99 (Unix; Netscape-Enterprise-Compatible)</code></p>
        <p><b>Features:</b></p>
        <ul>
          <li>Classic 1999 beveled Communicator toolbar, Location bar, and animated N throbber</li>
          <li>Live Xserver virtual host router, CGI-BIN guestbook &amp; comment handlers</li>
          <li>Full-text AltaVista search across built-in and user-published HTML pages</li>
          <li>Netscapeit Composer HTML builder for publishing directly to Xserver</li>
          <li>External HTTP/HTTPS proxy through Xserver for browsing lightweight web pages</li>
          <li>Optional 56k V.90 modem speed simulation &amp; Web Audio MIDI jukebox</li>
        </ul>
        <p><a href="http://home.netscapeit.com/">Go to Netcenter Home</a> &middot; <a href="http://xserver.local/">Open Xserver Console</a></p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
