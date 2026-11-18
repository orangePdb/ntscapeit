import React, { useState } from 'react';
import { X, Copy, Check, Download, Trash2, Volume2, ExternalLink } from 'lucide-react';
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
      className={`w-full ${maxWidth} bg-[#c0c0c0] bevel-out p-1 shadow-xl text-[#111827]`}
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
          className="w-5 h-5 bg-[#c0c0c0] text-black bevel-out-sm flex items-center justify-center cursor-pointer shrink-0"
        >
          <X className="w-3 h-3" />
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
      // Ignore clipboard failures in restricted environments
    }
  };

  return (
    <>
      {activeModal === 'source' && page && (
        <DialogShell title={`Page Source — ${page.normalizedUrl}`} onClose={onClose} maxWidth="max-w-4xl">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2 text-xs">
            <span className="tabular-nums text-[#374151]">
              Content-Type: <b>{page.contentType}</b> · Size: <b>{page.bytes.toLocaleString()} bytes</b>
            </span>
            <button
              type="button"
              onClick={() => void handleCopySource()}
              className="px-2.5 py-1 netscape-raised-btn text-xs font-medium cursor-pointer inline-flex items-center gap-1"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-700" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy Source'}
            </button>
          </div>
          <pre className="bg-white bevel-in p-3 text-xs font-mono-retro overflow-auto max-h-[60vh] whitespace-pre-wrap break-all select-text">
            {page.html}
          </pre>
          <div className="mt-3 flex justify-end">
            <button type="button" onClick={onClose} className="px-4 py-1 netscape-raised-btn text-xs font-semibold cursor-pointer">
              Close
            </button>
          </div>
        </DialogShell>
      )}

      {activeModal === 'headers' && page && (
        <DialogShell title={`Xserver HTTP Headers — ${page.host}`} onClose={onClose} maxWidth="max-w-xl">
          <div className="bg-white bevel-in p-3 text-xs font-mono-retro space-y-2">
            <div className="font-bold text-[#003366]">
              HTTP/1.0 {page.status} {page.statusText}
            </div>
            <div className="border-t border-[#d1d5db] pt-2 space-y-1">
              {Object.entries(page.headers).map(([k, v]) => (
                <div key={k} className="flex gap-2">
                  <span className="font-semibold text-[#1f2937] min-w-[140px]">{k}:</span>
                  <span className="text-[#374151] break-all">{v}</span>
                </div>
              ))}
              <div className="flex gap-2 pt-1 border-t border-[#e5e7eb]">
                <span className="font-semibold text-[#1f2937] min-w-[140px]">X-Elapsed-Time:</span>
                <span className="tabular-nums text-[#374151]">{page.elapsedMs} ms</span>
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
              className="px-3 py-1 netscape-raised-btn text-xs font-medium cursor-pointer"
            >
              Open Xserver Console
            </button>
            <button type="button" onClick={onClose} className="px-4 py-1 netscape-raised-btn text-xs font-semibold cursor-pointer">
              OK
            </button>
          </div>
        </DialogShell>
      )}

      {activeModal === 'preferences' && (
        <DialogShell title="netscapeit Preferences" onClose={onClose} maxWidth="max-w-lg">
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
                className="mt-3 px-3 py-1 netscape-raised-btn text-xs font-medium cursor-pointer inline-flex items-center gap-1.5"
              >
                <Volume2 className="w-3.5 h-3.5" />
                Test 56k Modem Handshake Sound
              </button>
            </fieldset>

            <fieldset className="border border-[#808080] p-3">
              <legend className="px-1 font-bold">Document Zoom / Text Size</legend>
              <div className="flex items-center gap-3 mt-1">
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

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={onClearHistory}
                className="px-3 py-1 netscape-raised-btn text-xs cursor-pointer"
              >
                Clear Session History
              </button>
              <button type="button" onClick={onClose} className="px-4 py-1 netscape-raised-btn text-xs font-semibold cursor-pointer">
                Done
              </button>
            </div>
          </div>
        </DialogShell>
      )}

      {activeModal === 'bookmarks' && (
        <DialogShell title="Bookmarks Manager — netscapeit" onClose={onClose} maxWidth="max-w-lg">
          <div className="flex items-center justify-between mb-2 text-xs">
            <span className="font-semibold">Saved Bookmarks ({bookmarks.length})</span>
            <button
              type="button"
              onClick={onAddCurrentBookmark}
              className="px-2.5 py-1 netscape-raised-btn text-xs font-medium cursor-pointer"
            >
              + Bookmark Current Page
            </button>
          </div>
          <div className="bg-white bevel-in max-h-64 overflow-y-auto divide-y divide-[#e5e7eb]">
            {bookmarks.map((bm) => (
              <div key={bm.id} className="flex items-center justify-between px-2.5 py-2 text-xs hover:bg-[#eef2ff]">
                <button
                  type="button"
                  onClick={() => {
                    onNavigate(bm.url);
                    onClose();
                  }}
                  className="text-left flex-1 min-w-0 pr-2 cursor-pointer"
                >
                  <div className="font-semibold text-[#0000cc] truncate flex items-center gap-1">
                    {bm.title}
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </div>
                  <div className="text-[11px] font-mono-retro text-[#4b5563] truncate">{bm.url}</div>
                </button>
                <button
                  type="button"
                  onClick={() => onRemoveBookmark(bm.id)}
                  title="Delete Bookmark"
                  aria-label={`Remove ${bm.title}`}
                  className="p-1 text-[#6b7280] hover:text-[#dc2626] cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
          <div className="mt-3 flex justify-end">
            <button type="button" onClick={onClose} className="px-4 py-1 netscape-raised-btn text-xs font-semibold cursor-pointer">
              Close
            </button>
          </div>
        </DialogShell>
      )}

      {activeModal === 'about' && (
        <DialogShell title="About netscapeit Communicator" onClose={onClose} maxWidth="max-w-md">
          <div className="bg-white bevel-in p-4 text-xs space-y-2.5 leading-relaxed">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-[#001429] text-white flex items-center justify-center font-bold text-2xl bevel-out" style={{ fontFamily: 'Georgia, serif' }}>
                N
              </div>
              <div>
                <div className="text-sm font-bold text-[#003366]">netscapeit Communicator 4.72</div>
                <div className="text-[#4b5563]">Powered by Xserver/1.99 Virtual Hosting</div>
              </div>
            </div>
            <p className="text-[#374151]">
              A 1999-inspired desktop web browser built to browse classic Netcenter channels, GeoCities CGI guestbooks, AltaVista web search, Slashdot discussions, and live Xserver virtual hosts.
            </p>
            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => {
                  onNavigate('about:mozilla');
                  onClose();
                }}
                className="text-[#0000cc] underline cursor-pointer"
              >
                about:mozilla
              </button>
              <button
                type="button"
                onClick={() => {
                  onNavigate('http://xserver.local/');
                  onClose();
                }}
                className="text-[#0000cc] underline cursor-pointer"
              >
                Xserver Console
              </button>
            </div>
          </div>
          <div className="mt-3 flex justify-end">
            <button type="button" onClick={onClose} className="px-4 py-1 netscape-raised-btn text-xs font-semibold cursor-pointer">
              OK
            </button>
          </div>
        </DialogShell>
      )}

      {/* Classic 1999 File Download Progress Dialog */}
      {downloadJob && (
        <div className="fixed bottom-10 right-6 z-50 w-80 bg-[#c0c0c0] bevel-out p-1 shadow-xl text-xs">
          <div
            className="flex items-center justify-between px-2 py-1 text-white font-bold"
            style={{ background: 'linear-gradient(90deg, #000080 0%, #1084d0 100%)' }}
          >
            <span className="truncate">Saving {downloadJob.filename}</span>
            <button
              type="button"
              onClick={onDismissDownload}
              aria-label="Close download window"
              className="w-4 h-4 bg-[#c0c0c0] text-black bevel-out-sm flex items-center justify-center cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
          <div className="p-3 space-y-2.5">
            <div className="flex items-center justify-between tabular-nums">
              <span className="text-[#1f2937] font-medium">
                {downloadJob.done ? 'Download Complete' : 'Transferring from Xserver...'}
              </span>
              <span className="font-mono-retro">{downloadJob.speedKbps.toFixed(1)} KB/s</span>
            </div>
            <div className="w-full h-4 bg-white bevel-in-sm overflow-hidden">
              <div
                className="h-full bg-[#000080] transition-all duration-150"
                style={{
                  width: `${Math.min(100, Math.round((downloadJob.downloadedKb / downloadJob.totalKb) * 100))}%`,
                }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] tabular-nums text-[#374151]">
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
                  className="px-3 py-1 netscape-raised-btn font-semibold cursor-pointer inline-flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
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
