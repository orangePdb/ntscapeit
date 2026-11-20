# 🌐 Netscapeit.org — Official Website

This directory contains the production-ready source code for the official **Netscapeit** website (`netscapeit.org`).

## 📁 Domain Architecture

- `netscapeit.org` (This website) — Official portal, downloads, documentation, technical manual, screenshots, and project info.
- `netscp.netscapeit.org` (Web application) — The actual interactive Netscapeit retro web browser running on the companion Xserver 1.99 engine.

## 🎨 Design Philosophy

Designed to evoke the authentic look and feel of an internet software company between 1998 and 2003 (inspired by Netscape, AOL, Tucows, and Microsoft Internet Explorer distribution sites):
- Classic beveled button styling (`bevel-out`, `bevel-in`, outset/inset borders).
- Deep corporate navy (`#003366`), orange accents (`#ff6600`), and classic light gray panels (`#ece9d8`).
- Dense information layout, tabbed navigation, and technical tickers.
- Web Audio API 56k dial-up handshake sound tester.

## 🚀 How to Preview Locally

You can preview the website locally using any standard static file server:

```bash
# Option 1: Using Python
cd website
python3 -m http.server 8080

# Option 2: Using Node / npx
cd website
npx serve . -p 8080
```

Then visit `http://localhost:8080` in your web browser.

## ☁️ Deployment Instructions for `netscapeit.org`

Because the website is built with clean, standards-compliant static HTML5, CSS3, and vanilla JavaScript, it can be deployed to any hosting platform with zero build configuration:

### Cloudflare Pages
1. Connect repository `orangePdb/ntscapeit`.
2. Set **Build output directory** to `website`.
3. Set Custom Domain to `netscapeit.org`.

### GitHub Pages
1. In repository settings, set Pages source to the `main` branch, `/website` folder.
2. Add custom domain `netscapeit.org` and enforce HTTPS.

### Vercel / Netlify
1. Set Root Directory to `website`.
2. Output Directory: `.` (leave empty for static files).
3. Connect domain `netscapeit.org`.

---
*Created by orangePdb for the Netscapeit Project.*
