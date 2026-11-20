import React, { useState } from 'react';
import type { BookmarkItem, BrowserResponse, ConnectionSpeed, DownloadJob } from '../types/browser';
import { playModemHandshake } from '../utils/retroAudio';

export type ActiveModalType =
  | null
  | 'source'
  | 'headers'
  | 'preferences'
  | 'bookmarks'
  | 'about';

interface BrowserModalsProps {
  activeModal: ActiveModalType;
  onClose: () => void;
  page: BrowserResponse | null;
  connectionSpeed: ConnectionSpeed;
  onChangeSpeed: (speed: ConnectionSpeed) => void;
  textScale: 'small' | 'normal' | 'large';
  onChangeTextScale: (scale: 'small' | 'normal' | 'large') => void;
  bookmarks: BookmarkItem[];
  onNavigate: (url: string) => void;
  onRemoveBookmark: (id: string) => void;
  onAddCurrentBookmark: () => void;
  onClearHistory: () => void;
  onFactoryReset: () => void;
  downloadJob: DownloadJob | null;
  onDismissDownload: () => void;
  onSaveDownloadedFile: (job: DownloadJob) => void;
}

const DialogShell: React.FC<{
  title: string;
  onClose: () => void;
  maxWidth?: string;
  children: React.ReactNode;
}> = ({ title, onClose, maxWidth = 'max-w-2xl', children }) => (
  <div
    className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
    onClick={onClose}
  >
    <div
      className={`w-full ${maxWidth} bg-[#c0c0c0] bevel-out p-1 shadow-[2px_2px_0_#000000] text-[#000000]`}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className="flex items-center justify-between px-2 py-1 text-white text-xs font-bold"
        style={{ background: 'linear-gradient(90deg, #000080 0%, #1084d0 100%)' }}
      >
        <span className="truncate pr-4">{title}</span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="w-4 h-4 bg-[#c0c0c0] text-black bevel-out-sm text-[10px] font-bold flex items-center justify-center cursor-pointer shrink-0 leading-none"
        >
          ×
        </button>
      </div>
      <div className="p-3">{children}</div>
    </div>
  </div>
);

export const BrowserModals: React.FC<BrowserModalsProps> = ({
  activeModal,
  onClose,
  page,
  connectionSpeed,
  onChangeSpeed,
  textScale,
  onChangeTextScale,
  bookmarks,
  onNavigate,
  onRemoveBookmark,
  onAddCurrentBookmark,
  onClearHistory,
  onFactoryReset,
  downloadJob,
  onDismissDownload,
  onSaveDownloadedFile,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopySource = async () => {
    if (!page) return;
    try {
      await navigator.clipboard.writeText(page.html);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Ignore clipboard failures
    }
  };

  return (
    <>
      {activeModal === 'source' && page && (
        <DialogShell title={`Source of: ${page.normalizedUrl}`} onClose={onClose} maxWidth="max-w-4xl">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2 text-xs">
            <span className="tabular-nums">
              Content-Type: <b>{page.contentType}</b> | Size: <b>{page.bytes.toLocaleString()} bytes</b>
            </span>
            <button
              type="button"
              onClick={() => void handleCopySource()}
              className="px-3 py-1 netscape-raised-btn text-xs font-bold cursor-pointer"
            >
              {copied ? 'Copied!' : 'Copy HTML'}
            </button>
          </div>
          <pre className="bg-white bevel-in p-3 text-xs font-mono-retro overflow-auto max-h-[60vh] whitespace-pre-wrap break-all select-text">
            {page.html}
          </pre>
          <div className="mt-3 flex justify-end">
            <button type="button" onClick={onClose} className="px-4 py-1 netscape-raised-btn text-xs font-bold cursor-pointer">
              Close
            </button>
          </div>
        </DialogShell>
      )}

      {activeModal === 'headers' && page && (
        <DialogShell title={`Page Info & Security — ${page.host}`} onClose={onClose} maxWidth="max-w-xl">
          <div className="bg-white bevel-in p-3 text-xs font-mono-retro space-y-2">
            <div className="font-bold text-[#000080]">
              HTTP/1.0 {page.status} {page.statusText}
            </div>
            <div className="border-t border-[#808080] pt-2 space-y-1">
              {Object.entries(page.headers).map(([k, v]) => (
                <div key={k} className="flex gap-2">
                  <span className="font-bold min-w-[150px]">{k}:</span>
                  <span className="break-all">{v}</span>
                </div>
              ))}
              <div className="flex gap-2 pt-1 border-t border-[#cccccc]">
                <span className="font-bold min-w-[150px]">X-Elapsed-Time:</span>
                <span className="tabular-nums">{page.elapsedMs} ms</span>
              </div>
            </div>
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onNavigate('http://xserver.local/');
              }}
              className="px-3 py-1 netscape-raised-btn text-xs font-bold cursor-pointer"
            >
              Open Xserver Console
            </button>
            <button type="button" onClick={onClose} className="px-4 py-1 netscape-raised-btn text-xs font-bold cursor-pointer">
              OK
            </button>
          </div>
        </DialogShell>
      )}

      {activeModal === 'preferences' && (
        <DialogShell title="Netscape Navigator 4.72 Preferences" onClose={onClose} maxWidth="max-w-lg">
          <div className="space-y-4 text-xs">
            <fieldset className="border border-[#808080] p-3">
              <legend className="px-1 font-bold">Dial-Up &amp; Xserver Connection Speed</legend>
              <div className="space-y-2 mt-1">
                {(
                  [
                    { id: '56k', label: '56k V.90 Dial-Up Modem (Progressive 1999 loading)' },
                    { id: 'isdn', label: '128k Dual ISDN (Fast 1999 office line)' },
                    { id: 't1', label: 'T1 / LAN 1.54 Mbps (Instantaneous Xserver response)' },
                  ] as const
                ).map((opt) => (
                  <label key={opt.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="speed"
                      checked={connectionSpeed === opt.id}
                      onChange={() => onChangeSpeed(opt.id)}
                    />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>
              <button
                type="button"
                onClick={playModemHandshake}
                className="mt-3 px-3 py-1 netscape-raised-btn text-xs font-bold cursor-pointer"
              >
                Test 56k Modem Handshake Sound
              </button>
            </fieldset>

            <fieldset className="border border-[#808080] p-3">
              <legend className="px-1 font-bold">Document Font Size</legend>
              <div className="flex items-center gap-4 mt-1">
                {(['small', 'normal', 'large'] as const).map((sz) => (
                  <label key={sz} className="flex items-center gap-1.5 cursor-pointer capitalize">
                    <input
                      type="radio"
                      name="textScale"
                      checked={textScale === sz}
                      onChange={() => onChangeTextScale(sz)}
                    />
                    <span>{sz}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className="border border-[#808080] p-3">
              <legend className="px-1 font-bold">System &amp; Installation</legend>
              <p className="text-[#333333] mb-2">
                Restore default bookmarks, preferences, and Xserver data, then replay the Windows 98 CD-ROM setup animation.
              </p>
              <button
                type="button"
                onClick={onFactoryReset}
                className="px-3 py-1 netscape-raised-btn text-xs font-bold text-[#800000] cursor-pointer"
              >
                Factory Reset
              </button>
            </fieldset>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={onClearHistory}
                className="px-3 py-1 netscape-raised-btn text-xs cursor-pointer"
              >
                Clear Session History
              </button>
              <button type="button" onClick={onClose} className="px-4 py-1 netscape-raised-btn text-xs font-bold cursor-pointer">
                OK
              </button>
            </div>
          </div>
        </DialogShell>
      )}

      {activeModal === 'bookmarks' && (
        <DialogShell title="Bookmarks — Netscape Navigator 4.72" onClose={onClose} maxWidth="max-w-lg">
          <div className="flex items-center justify-between mb-2 text-xs">
            <span className="font-bold">Personal Toolbar &amp; Bookmarks ({bookmarks.length})</span>
            <button
              type="button"
              onClick={onAddCurrentBookmark}
              className="px-2.5 py-1 netscape-raised-btn text-xs font-bold cursor-pointer"
            >
              Add Current Page
            </button>
          </div>
          <div className="bg-white bevel-in max-h-64 overflow-y-auto divide-y divide-[#cccccc]">
            {bookmarks.map((bm) => (
              <div key={bm.id} className="flex items-center justify-between px-2.5 py-2 text-xs hover:bg-[#000080] hover:text-white group">
                <button
                  type="button"
                  onClick={() => {
                    onNavigate(bm.url);
                    onClose();
                  }}
                  className="text-left flex-1 min-w-0 pr-2 cursor-pointer"
                >
                  <div className="font-bold truncate">{bm.title}</div>
                  <div className="text-[11px] font-mono-retro opacity-80 truncate">{bm.url}</div>
                </button>
                <button
                  type="button"
                  onClick={() => onRemoveBookmark(bm.id)}
                  title="Delete Bookmark"
                  aria-label={`Remove ${bm.title}`}
                  className="px-2 py-0.5 netscape-raised-btn text-[11px] text-black cursor-pointer shrink-0"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
          <div className="mt-3 flex justify-end">
            <button type="button" onClick={onClose} className="px-4 py-1 netscape-raised-btn text-xs font-bold cursor-pointer">
              Close
            </button>
          </div>
        </DialogShell>
      )}

      {activeModal === 'about' && (
        <DialogShell title="About Netscape Navigator 4.72 [netscapeit]" onClose={onClose} maxWidth="max-w-md">
          <div className="bg-white bevel-in p-4 text-xs space-y-2.5 leading-relaxed">
            <div className="flex items-center gap-3">
              <div
                className="w-11 h-11 bg-[#001429] text-white flex items-center justify-center font-bold text-2xl bevel-out"
                style={{ fontFamily: 'Georgia, serif' }}
              >
                N
              </div>
              <div>
                <div className="text-sm font-bold text-[#000080]">Netscape Navigator 4.72 [netscapeit]</div>
                <div className="text-[#333333]">Server: Xserver/1.99 (Unix; HTTP/1.0)</div>
              </div>
            </div>
            <p>
              Copyright &copy; 1994–1999 Netscape Communications / netscapeit. Communicator 4.72 running on <b>Xserver/1.99</b> with live YouTube 1999 gateway, CGI guestbooks, AltaVista web search, and historical web archive support.
            </p>
            <div className="flex items-center gap-4 pt-1">
              <button
                type="button"
                onClick={() => {
                  onNavigate('about:mozilla');
                  onClose();
                }}
                className="text-[#0000cc] underline cursor-pointer font-bold"
              >
                about:mozilla
              </button>
              <button
                type="button"
                onClick={() => {
                  onNavigate('http://youtube.xserver.net/');
                  onClose();
                }}
                className="text-[#0000cc] underline cursor-pointer font-bold"
              >
                YouTube 1999 Gateway
              </button>
              <button
                type="button"
                onClick={() => {
                  onNavigate('http://xserver.local/');
                  onClose();
                }}
                className="text-[#0000cc] underline cursor-pointer font-bold"
              >
                Xserver Console
              </button>
            </div>
          </div>
          <div className="mt-3 flex justify-end">
            <button type="button" onClick={onClose} className="px-4 py-1 netscape-raised-btn text-xs font-bold cursor-pointer">
              OK
            </button>
          </div>
        </DialogShell>
      )}

      {/* Classic 1999 File Download Progress Dialog */}
      {downloadJob && (
        <div className="fixed bottom-10 right-6 z-50 w-80 bg-[#c0c0c0] bevel-out p-1 shadow-[2px_2px_0_#000000] text-xs">
          <div
            className="flex items-center justify-between px-2 py-1 text-white font-bold"
            style={{ background: 'linear-gradient(90deg, #000080 0%, #1084d0 100%)' }}
          >
            <span className="truncate">Saving {downloadJob.filename}</span>
            <button
              type="button"
              onClick={onDismissDownload}
              aria-label="Close download window"
              className="w-4 h-4 bg-[#c0c0c0] text-black bevel-out-sm text-[10px] font-bold flex items-center justify-center cursor-pointer"
            >
              ×
            </button>
          </div>
          <div className="p-3 space-y-2.5">
            <div className="flex items-center justify-between tabular-nums">
              <span className="font-bold">
                {downloadJob.done ? 'Download Complete' : 'Transferring from Xserver...'}
              </span>
              <span className="font-mono-retro">{downloadJob.speedKbps.toFixed(1)} KB/s</span>
            </div>
            <div className="w-full h-4 bg-white bevel-in-sm overflow-hidden">
              <div
                className="h-full bg-[#000080]"
                style={{
                  width: `${Math.min(100, Math.round((downloadJob.downloadedKb / downloadJob.totalKb) * 100))}%`,
                }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] tabular-nums">
              <span>
                {downloadJob.downloadedKb.toFixed(0)} KB of {downloadJob.totalKb} KB
              </span>
              <span>{Math.min(100, Math.round((downloadJob.downloadedKb / downloadJob.totalKb) * 100))}%</span>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              {downloadJob.done && (
                <button
                  type="button"
                  onClick={() => onSaveDownloadedFile(downloadJob)}
                  className="px-3 py-1 netscape-raised-btn font-bold cursor-pointer"
                >
                  Save File
                </button>
              )}
              <button
                type="button"
                onClick={onDismissDownload}
                className="px-3 py-1 netscape-raised-btn cursor-pointer"
              >
                {downloadJob.done ? 'Close' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
