import { GoogleGenAI } from '@google/genai';
import { getBridgeScript } from './sites.ts';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getAiClient(): GoogleGenAI | null {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key === 'MY_GEMINI_API_KEY') return null;
  return new GoogleGenAI({ apiKey: key });
}

interface InteractionStepLike {
  type?: string;
  content?: Array<{ type?: string; text?: string }>;
}

function collectModelText(steps: unknown): string {
  if (!Array.isArray(steps)) return '';
  let out = '';
  for (const rawStep of steps) {
    const step = rawStep as InteractionStepLike;
    if (step.type === 'model_output' && Array.isArray(step.content)) {
      for (const part of step.content) {
        if (part.type === 'text' && typeof part.text === 'string') {
          out += part.text;
        }
      }
    }
  }
  return out.trim();
}

export async function runLiveWebSearchViaInteractions(query: string): Promise<string> {
  const ai = getAiClient();
  if (!ai) {
    throw new Error('GEMINI_API_KEY is not configured in environment secrets.');
  }

  const interaction = await ai.interactions.create({
    model: 'gemini-4-hydrogen',
    input: `Search the live web for: "${query}". Return ONLY clean 1999 Netscape Navigator 4.72 HTML fragment (a classic <table> or <ol> list of real findings with <a href="https://..."> clickable source URLs and concise summaries). No markdown fences, no modern CSS.`,
    tools: [{ type: 'google_search' }],
  });

  const text = collectModelText(interaction.steps) || interaction.output_text || '';
  if (!text) {
    throw new Error('Interactions API returned empty output.');
  }

  const cleaned = text
    .replace(/^```html?\s*/i, '')
    .replace(/```\s*$/i, '')
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  return `<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<html>
<head><title>AltaVista Live Web Search: ${escapeHtml(query)}</title></head>
<body bgcolor="#ffffff" text="#000000" style="font-family:Arial,Helvetica,sans-serif;font-size:13px;margin:16px;">
  <table width="100%" border="0" cellpadding="8" cellspacing="0" bgcolor="#004a8f">
    <tr>
      <td>
        <font size="4" color="#ffffff"><b>AltaVista Live Web</b></font>
        <font size="2" color="#ffcc00"> &mdash; Gemini Interactions Search Grounding</font>
      </td>
      <td align="right"><a href="http://altavista.xserver.net/" style="color:#ffffff;font-size:12px;">Back to AltaVista</a></td>
    </tr>
  </table>
  <br>
  <p><font size="2">Live web results for <b>"${escapeHtml(query)}"</b>:</font></p>
  <div style="line-height:1.55;">${cleaned}</div>
  ${getBridgeScript(`http://altavista.xserver.net/?q=${encodeURIComponent(query)}&mode=web`)}
</body>
</html>`;
}

export async function transcodeUrlViaInteractions(targetUrl: string): Promise<string> {
  const ai = getAiClient();
  if (!ai) {
    throw new Error('GEMINI_API_KEY is not configured in environment secrets.');
  }

  const interaction = await ai.interactions.create({
    model: 'gemini-4-hydrogen',
    input: `Fetch and read the webpage at ${targetUrl}. Convert its real content, headings, key sections, and real links into an authentic 1999 Netscape Navigator 4.72 HTML 4.0 document using classic <table> layouts, <font> tags, and <hr> dividers. Use only real information from that URL. Return ONLY raw HTML inside <body>...</body> (no markdown code fences).`,
    tools: [{ type: 'url_context' }],
  });

  const text = collectModelText(interaction.steps) || interaction.output_text || '';
  if (!text) {
    throw new Error('Interactions API returned empty output for URL.');
  }

  const cleaned = text
    .replace(/^```html?\s*/i, '')
    .replace(/```\s*$/i, '')
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  return `<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<html>
<head><title>${escapeHtml(targetUrl)} (1999 Navigator Edition)</title></head>
<body bgcolor="#ffffff" text="#000000" style="font-family:Verdana,Arial,sans-serif;font-size:13px;margin:0;padding:0;">
  <table width="100%" border="0" cellpadding="6" cellspacing="0" bgcolor="#ffffe1" style="border-bottom:1px solid #999999;">
    <tr>
      <td><font size="1"><b>Xserver 1999 Transcoder (Interactions API):</b> ${escapeHtml(targetUrl)} &nbsp;|&nbsp; <a href="${escapeHtml(targetUrl)}">Load Raw Proxy</a> &nbsp;|&nbsp; <a href="http://home.netscapeit.com/">Netcenter</a></font></td>
    </tr>
  </table>
  <div style="padding:14px;">${cleaned}</div>
  ${getBridgeScript(targetUrl)}
</body>
</html>`;
}
