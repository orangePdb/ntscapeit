import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  ChevronDown,
  FileCode2,
  FolderOpen,
  Home,
  Lock,
  LockOpen,
  Plus,
  RotateCw,
  Search,
  Server,
  ShieldCheck,
  Square,
  Volume2,
} from 'lucide-react';
import type {
  BookmarkItem,
  BrowserResponse,
  ConnectionSpeed,
  DownloadJob,
  HistoryEntry,
} from './types/browser';
import { NetscapeThrobber } from './components/NetscapeThrobber';
import { BrowserViewport } from './components/BrowserViewport';
import { BrowserModals } from './components/BrowserModals';
import type { ActiveModalType } from './components/BrowserModals';
import { playMidiTrack, stopRetroAudio } from './utils/retroAudio';

const HOME_URL = 'http://home.netscapeit.com/';

const DEFAULT_BOOKMARKS: BookmarkItem[] = [
  { id: 'bm-1', title: 'Netcenter', url: 'http://home.netscapeit.com/' },
  { id: 'bm-2', title: 'Xserver Console', url: 'http://xserver.local/' },
  { id: 'bm-3', title: 'AltaVista', url: 'http://altavista.xserver.net/' },
  { id: 'bm-4', title: "Cyberia '99", url: 'http://geocities.xserver.net/cyberia/99/' },
  { id: 'bm-5', title: "Slashdot '99", url: 'http://slashdot.xserver.org/' },
  { id: 'bm-6', title: 'Winamp Vault', url: 'http://winamp.xserver.com/' },
  { id: 'bm-7', title: 'Planet 1999', url: 'http://spacejam.xserver.org/' },
  { id: 'bm-8', title: 'Composer', url: 'http://webmaster.xserver.local/builder.html' },
];

type MenuKey = 'file' | 'edit' | 'view' | 'go' | 'communicator' | 'help' | 'related' | null;

export default function App() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [currentPage, setCurrentPage] = useState<BrowserResponse | null>(null);
  const [locationInput, setLocationInput] = useState<string>(HOME_URL);

  const [loading, setLoading] = useState<boolean>(false);
  const [loadProgress, setLoadProgress] = useState<number>(100);
  const [statusText, setStatusText] = useState<string>('Document: Done');

  const [connectionSpeed, setConnectionSpeed] = useState<ConnectionSpeed>('t1');
  const [textScale, setTextScale] = useState<'small' | 'normal' | 'large'>('normal');
  const [showPersonalBar, setShowPersonalBar] = useState<boolean>(true);
  const [windowedMode, setWindowedMode] = useState<boolean>(false);

  const [openMenu, setOpenMenu] = useState<MenuKey>(null);
  const [activeModal, setActiveModal] = useState<ActiveModalType>(null);
  const [findOpen, setFindOpen] = useState<boolean>(false);
  const [findQuery, setFindQuery] = useState<string>('');
  const [playingTrack, setPlayingTrack] = useState<string | null>(null);
  const [downloadJob, setDownloadJob] = useState<DownloadJob | null>(null);

  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>(() => {
    try {
      const saved = localStorage.getItem('netscapeit_bookmarks_v1');
      if (saved) {
        const parsed = JSON.parse(saved) as BookmarkItem[];
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Fallback to defaults
    }
    return DEFAULT_BOOKMARKS;
  });

  const locationInputRef = useRef<HTMLInputElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const simTimerRef = useRef<number | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('netscapeit_bookmarks_v1', JSON.stringify(bookmarks));
    } catch {
      // Ignore storage errors
    }
  }, [bookmarks]);

  // Close menus on outside click or Escape
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenMenu(null);
        setActiveModal(null);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setFindOpen(true);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        locationInputRef.current?.focus();
        locationInputRef.current?.select();
      }
    };
    const onDocClick = () => setOpenMenu(null);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('click', onDocClick);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('click', onDocClick);
    };
  }, []);

  const clearSimTimer = () => {
    if (simTimerRef.current !== null) {
      window.clearInterval(simTimerRef.current);
      simTimerRef.current = null;
    }
  };

  const loadUrl = useCallback(
    async (rawUrl: string, options?: { pushHistory?: boolean }) => {
      const pushHistory = options?.pushHistory !== false;
      clearSimTimer();
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setOpenMenu(null);
      setLoading(true);
      setLoadProgress(12);
      setStatusText(`Connect: Contacting ${rawUrl} via Xserver/1.99...`);

      try {
        const res = await fetch(`/api/xserver/browse?url=${encodeURIComponent(rawUrl)}`, {
          signal: controller.signal,
        });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const data = (await res.json()) as BrowserResponse;

        // Simulate 56k / ISDN progressive transfer if enabled
        const delayMs =
          connectionSpeed === '56k' ? 950 : connectionSpeed === 'isdn' ? 320 : 0;

        if (delayMs > 0) {
          setStatusText(`Transferring data from ${data.host} (${(data.bytes / 1024).toFixed(1)} KB)...`);
          await new Promise<void>((resolve, reject) => {
            const steps = 6;
            let currentStep = 1;
            const onAbort = () => {
              clearSimTimer();
              reject(new DOMException('Aborted', 'AbortError'));
            };
            controller.signal.addEventListener('abort', onAbort, { once: true });

            simTimerRef.current = window.setInterval(() => {
              currentStep += 1;
              const pct = Math.min(96, Math.round((currentStep / steps) * 95));
              setLoadProgress(pct);
              if (currentStep >= steps) {
                clearSimTimer();
                controller.signal.removeEventListener('abort', onAbort);
                resolve();
              }
            }, Math.round(delayMs / steps));
          });
        }

        setCurrentPage(data);
        setLocationInput(data.normalizedUrl);
        setLoadProgress(100);
        setLoading(false);
        setStatusText(
          `Document: Done (${(data.bytes / 1024).toFixed(1)} KB · ${data.elapsedMs}ms via Xserver/1.99)`
        );

        if (pushHistory) {
          setHistory((prev) => {
            const sliced = prev.slice(0, historyIndex + 1);
            const next = [
              ...sliced,
              { url: data.normalizedUrl, title: data.title, visitedAt: Date.now() },
            ];
            setHistoryIndex(next.length - 1);
            return next;
          });
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          setLoading(false);
          setStatusText('Transfer interrupted.');
          return;
        }
        setLoading(false);
        setStatusText('Error: Unable to reach Xserver.');
      }
    },
    [connectionSpeed, historyIndex]
  );

  // Initial load
  useEffect(() => {
    void loadUrl(HOME_URL, { pushHistory: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Simulated Download Timer
  useEffect(() => {
    if (!downloadJob || downloadJob.done) return;
    const speedKbps =
      connectionSpeed === '56k' ? 5.6 : connectionSpeed === 'isdn' ? 14.8 : 96.0;
    const timer = window.setInterval(() => {
      setDownloadJob((prev) => {
        if (!prev || prev.done) return prev;
        const nextKb = Math.min(prev.totalKb, prev.downloadedKb + speedKbps * 0.2);
        return {
          ...prev,
          speedKbps,
          downloadedKb: nextKb,
          done: nextKb >= prev.totalKb,
        };
      });
    }, 180);
    return () => window.clearInterval(timer);
  }, [downloadJob, connectionSpeed]);

  const handleBack = () => {
    if (historyIndex <= 0) return;
    const targetIdx = historyIndex - 1;
    setHistoryIndex(targetIdx);
    void loadUrl(history[targetIdx].url, { pushHistory: false });
  };

  const handleForward = () => {
    if (historyIndex >= history.length - 1) return;
    const targetIdx = historyIndex + 1;
    setHistoryIndex(targetIdx);
    void loadUrl(history[targetIdx].url, { pushHistory: false });
  };

  const handleReload = () => {
    void loadUrl(currentPage?.normalizedUrl || locationInput, { pushHistory: false });
  };

  const handleStop = () => {
    clearSimTimer();
    abortRef.current?.abort();
    stopRetroAudio();
    setPlayingTrack(null);
    setLoading(false);
    setStatusText('Document: Stopped.');
  };

  const handleLocationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void loadUrl(locationInput, { pushHistory: true });
  };

  const handleFormSubmit = useCallback(
    async (payload: {
      action: string;
      method: string;
      data: Record<string, string>;
      currentUrl: string;
    }) => {
      if (payload.method === 'GET') {
        try {
          const target = new URL(payload.action || payload.currentUrl);
          Object.entries(payload.data).forEach(([k, v]) => {
            target.searchParams.set(k, v);
          });
          void loadUrl(target.toString(), { pushHistory: true });
          return;
        } catch {
          void loadUrl(payload.action, { pushHistory: true });
          return;
        }
      }

      // POST CGI handlers on Xserver
      if (payload.action.includes('guestbook.cgi')) {
        setStatusText('CGI: Posting guestbook entry to Xserver...');
        try {
          const res = await fetch('/api/xserver/cgi/guestbook', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload.data),
          });
          const out = await res.json();
          if (out.redirectUrl) {
            void loadUrl(out.redirectUrl, { pushHistory: false });
          }
        } catch {
          setStatusText('CGI Error: Guestbook post failed.');
        }
        return;
      }

      if (payload.action.includes('comment.cgi')) {
        setStatusText('CGI: Posting comment to Xserver...');
        try {
          const res = await fetch('/api/xserver/cgi/comment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload.data),
          });
          const out = await res.json();
          if (out.redirectUrl) {
            void loadUrl(out.redirectUrl, { pushHistory: false });
          }
        } catch {
          setStatusText('CGI Error: Comment post failed.');
        }
      }
    },
    [loadUrl]
  );

  const handleDownloadTrigger = useCallback(
    (filename: string, sizeKb: number, url: string) => {
      const speedKbps =
        connectionSpeed === '56k' ? 5.6 : connectionSpeed === 'isdn' ? 14.8 : 96.0;
      setDownloadJob({
        id: `dl-${Date.now()}`,
        filename,
        url,
        totalKb: sizeKb,
        downloadedKb: 0,
        speedKbps,
        done: false,
      });
    },
    [connectionSpeed]
  );

  const handleSaveDownloadedFile = (job: DownloadJob) => {
    const content = `Downloaded from Xserver/1.99 via netscapeit\nFile: ${job.filename}\nSource: ${job.url}\nSize: ${job.totalKb} KB\nDate: 1999-11-18\n`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = job.filename;
    a.click();
    URL.revokeObjectURL(a.href);
    setDownloadJob(null);
  };

  const handleSaveCurrentHtml = () => {
    if (!currentPage) return;
    const blob = new Blob([currentPage.html], { type: 'text/html;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${currentPage.host || 'page'}.html`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const handlePlayAudio = useCallback((track: string) => {
    if (track === 'stop') {
      stopRetroAudio();
      setPlayingTrack(null);
      setStatusText('MIDI Audio: Stopped.');
      return;
    }
    const label = playMidiTrack(track);
    setPlayingTrack(`${track}.mid`);
    setStatusText(`Audio: ${label}`);
  }, []);

  const handleAddBookmark = () => {
    if (!currentPage) return;
    const exists = bookmarks.some((b) => b.url === currentPage.normalizedUrl);
    if (exists) {
      setStatusText('Bookmark already saved.');
      return;
    }
    const shortTitle = currentPage.title.split('—')[0].trim().slice(0, 22) || currentPage.host;
    setBookmarks((prev) => [
      ...prev,
      { id: `bm-${Date.now()}`, title: shortTitle, url: currentPage.normalizedUrl },
    ]);
    setStatusText(`Saved bookmark: ${shortTitle}`);
  };

  const canBack = historyIndex > 0;
  const canForward = historyIndex < history.length - 1;

  return (
    <div
      className={`h-screen w-screen bg-[#008080] flex flex-col overflow-hidden ${
        windowedMode ? 'p-4 md:p-7' : 'p-0'
      }`}
    >
      {/* Main Netscapeit Communicator Browser Window */}
      <div className="flex-1 min-h-0 flex flex-col bg-[#c0c0c0] bevel-out overflow-hidden">
        {/* 1. Classic Title Bar */}
        <div
          className="h-7 px-2 flex items-center justify-between text-white shrink-0"
          style={{ background: 'linear-gradient(90deg, #000080 0%, #1084d0 100%)' }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="w-4 h-4 bg-[#001429] border border-[#6699cc] flex items-center justify-center text-[11px] font-bold leading-none shrink-0"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              N
            </div>
            <span className="text-xs font-bold truncate">
              {currentPage ? `${currentPage.title} - netscapeit` : 'netscapeit'}
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setWindowedMode((v) => !v)}
              title={windowedMode ? 'Maximize Window' : 'Restore Windowed Mode'}
              aria-label={windowedMode ? 'Maximize Window' : 'Restore Windowed Mode'}
              className="w-5 h-4 bg-[#c0c0c0] text-black bevel-out-sm text-[10px] font-bold flex items-center justify-center cursor-pointer"
            >
              {windowedMode ? '□' : '❐'}
            </button>
            <button
              type="button"
              onClick={() => void loadUrl(HOME_URL, { pushHistory: true })}
              title="Reset to Netcenter Home"
              aria-label="Reset to Home"
              className="w-5 h-4 bg-[#c0c0c0] text-black bevel-out-sm text-[10px] font-bold flex items-center justify-center cursor-pointer"
            >
              ×
            </button>
          </div>
        </div>

        {/* 2. Menu Bar */}
        <div
          className="relative px-1.5 py-0.5 border-b border-[#808080] flex items-center gap-0.5 text-xs text-[#111827] shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          {(
            [
              { key: 'file', label: 'File' },
              { key: 'edit', label: 'Edit' },
              { key: 'view', label: 'View' },
              { key: 'go', label: 'Go' },
              { key: 'communicator', label: 'Communicator' },
              { key: 'help', label: 'Help' },
            ] as const
          ).map((m) => (
            <div key={m.key} className="relative">
              <button
                type="button"
                onClick={() => setOpenMenu((prev) => (prev === m.key ? null : m.key))}
                className={`px-2 py-0.5 cursor-pointer whitespace-nowrap ${
                  openMenu === m.key
                    ? 'bg-[#000080] text-white'
                    : 'hover:bg-[#000080] hover:text-white'
                }`}
              >
                {m.label}
              </button>

              {openMenu === m.key && (
                <div className="absolute left-0 top-full z-40 mt-0.5 min-w-[210px] bg-[#c0c0c0] bevel-out py-1 shadow-lg text-xs text-[#111827]">
                  {m.key === 'file' && (
                    <>
                      <MenuOption
                        label="Open Location..."
                        shortcut="Ctrl+L"
                        onClick={() => {
                          setOpenMenu(null);
                          locationInputRef.current?.focus();
                          locationInputRef.current?.select();
                        }}
                      />
                      <MenuOption
                        label="Save Page As (.html)..."
                        onClick={() => {
                          setOpenMenu(null);
                          handleSaveCurrentHtml();
                        }}
                      />
                      <MenuOption
                        label="Print Page..."
                        onClick={() => {
                          setOpenMenu(null);
                          window.print();
                        }}
                      />
                      <div className="my-1 border-t border-[#808080] border-b border-b-white" />
                      <MenuOption
                        label="Return to Netcenter Home"
                        onClick={() => {
                          setOpenMenu(null);
                          void loadUrl(HOME_URL);
                        }}
                      />
                    </>
                  )}

                  {m.key === 'edit' && (
                    <>
                      <MenuOption
                        label="Copy Location URL"
                        onClick={() => {
                          setOpenMenu(null);
                          if (currentPage) {
                            void navigator.clipboard?.writeText(currentPage.normalizedUrl);
                            setStatusText('Copied URL to clipboard.');
                          }
                        }}
                      />
                      <MenuOption
                        label="Find in Page..."
                        shortcut="Ctrl+F"
                        onClick={() => {
                          setOpenMenu(null);
                          setFindOpen(true);
                        }}
                      />
                      <div className="my-1 border-t border-[#808080] border-b border-b-white" />
                      <MenuOption
                        label="Preferences..."
                        onClick={() => {
                          setOpenMenu(null);
                          setActiveModal('preferences');
                        }}
                      />
                    </>
                  )}

                  {m.key === 'view' && (
                    <>
                      <MenuOption
                        label={showPersonalBar ? '✓ Show Personal Toolbar' : 'Show Personal Toolbar'}
                        onClick={() => {
                          setShowPersonalBar((v) => !v);
                          setOpenMenu(null);
                        }}
                      />
                      <MenuOption
                        label="Reload"
                        onClick={() => {
                          setOpenMenu(null);
                          handleReload();
                        }}
                      />
                      <MenuOption
                        label="Stop"
                        onClick={() => {
                          setOpenMenu(null);
                          handleStop();
                        }}
                      />
                      <div className="my-1 border-t border-[#808080] border-b border-b-white" />
                      <MenuOption
                        label="Page Source"
                        onClick={() => {
                          setOpenMenu(null);
                          setActiveModal('source');
                        }}
                      />
                      <MenuOption
                        label="Xserver HTTP Headers..."
                        onClick={() => {
                          setOpenMenu(null);
                          setActiveModal('headers');
                        }}
                      />
                      <div className="my-1 border-t border-[#808080] border-b border-b-white" />
                      <MenuOption
                        label={`Text Size: ${textScale.toUpperCase()}`}
                        onClick={() => {
                          const next =
                            textScale === 'normal'
                              ? 'large'
                              : textScale === 'large'
                              ? 'small'
                              : 'normal';
                          setTextScale(next);
                          setOpenMenu(null);
                        }}
                      />
                    </>
                  )}

                  {m.key === 'go' && (
                    <>
                      <MenuOption label="Back" disabled={!canBack} onClick={handleBack} />
                      <MenuOption label="Forward" disabled={!canForward} onClick={handleForward} />
                      <MenuOption
                        label="Home"
                        onClick={() => {
                          setOpenMenu(null);
                          void loadUrl(HOME_URL);
                        }}
                      />
                      <div className="my-1 border-t border-[#808080] border-b border-b-white" />
                      {history.slice(-6).reverse().map((item, idx) => (
                        <MenuOption
                          key={`${item.url}-${idx}`}
                          label={item.title.slice(0, 28)}
                          onClick={() => {
                            setOpenMenu(null);
                            void loadUrl(item.url);
                          }}
                        />
                      ))}
                    </>
                  )}

                  {m.key === 'communicator' && (
                    <>
                      <MenuOption
                        label="Xserver/1.99 Control Console"
                        onClick={() => {
                          setOpenMenu(null);
                          void loadUrl('http://xserver.local/');
                        }}
                      />
                      <MenuOption
                        label="Netscapeit Composer (HTML Editor)"
                        onClick={() => {
                          setOpenMenu(null);
                          void loadUrl('http://webmaster.xserver.local/builder.html');
                        }}
                      />
                      <MenuOption
                        label="Bookmarks Manager..."
                        onClick={() => {
                          setOpenMenu(null);
                          setActiveModal('bookmarks');
                        }}
                      />
                      <MenuOption
                        label="Dial-Up & Speed Preferences..."
                        onClick={() => {
                          setOpenMenu(null);
                          setActiveModal('preferences');
                        }}
                      />
                      {playingTrack && (
                        <MenuOption
                          label={`Stop Audio (${playingTrack})`}
                          onClick={() => {
                            setOpenMenu(null);
                            handlePlayAudio('stop');
                          }}
                        />
                      )}
                    </>
                  )}

                  {m.key === 'help' && (
                    <>
                      <MenuOption
                        label="About netscapeit & Xserver"
                        onClick={() => {
                          setOpenMenu(null);
                          setActiveModal('about');
                        }}
                      />
                      <MenuOption
                        label="about:mozilla"
                        onClick={() => {
                          setOpenMenu(null);
                          void loadUrl('about:mozilla');
                        }}
                      />
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 3. Navigation Toolbar */}
        <div className="px-2 py-1 border-t border-white border-b border-b-[#808080] flex items-center justify-between gap-2 shrink-0 overflow-x-auto">
          <div className="flex items-center gap-1">
            <ToolbarButton
              icon={<ArrowLeft className="w-4 h-4" />}
              label="Back"
              disabled={!canBack}
              onClick={handleBack}
            />
            <ToolbarButton
              icon={<ArrowRight className="w-4 h-4" />}
              label="Forward"
              disabled={!canForward}
              onClick={handleForward}
            />
            <ToolbarButton
              icon={<RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
              label="Reload"
              onClick={handleReload}
            />
            <ToolbarButton
              icon={<Home className="w-4 h-4" />}
              label="Home"
              onClick={() => void loadUrl(HOME_URL)}
            />
            <div className="w-px h-8 bg-[#808080] border-r border-white mx-0.5" />
            <ToolbarButton
              icon={<Search className="w-4 h-4" />}
              label="Search"
              onClick={() => void loadUrl('http://altavista.xserver.net/')}
            />
            <ToolbarButton
              icon={<Server className="w-4 h-4 text-[#003366]" />}
              label="Xserver"
              onClick={() => void loadUrl('http://xserver.local/')}
            />
            <ToolbarButton
              icon={<FileCode2 className="w-4 h-4 text-[#006666]" />}
              label="Composer"
              onClick={() => void loadUrl('http://webmaster.xserver.local/builder.html')}
            />
            <ToolbarButton
              icon={<ShieldCheck className="w-4 h-4 text-[#92400e]" />}
              label="Security"
              onClick={() => setActiveModal('headers')}
            />
            <ToolbarButton
              icon={<Square className="w-3.5 h-3.5 fill-[#dc2626] text-[#dc2626]" />}
              label="Stop"
              onClick={handleStop}
            />
          </div>

          <NetscapeThrobber loading={loading} onClick={() => void loadUrl(HOME_URL)} />
        </div>

        {/* 4. Location Toolbar */}
        <div
          className="px-2 py-1 border-t border-white border-b border-b-[#808080] flex items-center gap-2 text-xs shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => setActiveModal('bookmarks')}
            className="px-2 py-1 netscape-btn flex items-center gap-1 font-medium text-[#111827] cursor-pointer whitespace-nowrap shrink-0"
          >
            <Bookmark className="w-3.5 h-3.5 text-[#003366]" />
            Bookmarks
          </button>

          <form onSubmit={handleLocationSubmit} className="flex-1 flex items-center gap-1.5 min-w-0">
            <label htmlFor="location-bar" className="font-semibold text-[#111827] shrink-0">
              Location:
            </label>
            <input
              id="location-bar"
              ref={locationInputRef}
              type="text"
              value={locationInput}
              onChange={(e) => setLocationInput(e.target.value)}
              placeholder="http://home.netscapeit.com/"
              className="flex-1 min-w-0 px-2 py-0.5 bg-white bevel-in-sm text-xs font-mono-retro text-[#111827] focus:outline-none select-text"
            />
            <button
              type="submit"
              className="px-3 py-0.5 netscape-raised-btn text-xs font-semibold text-[#111827] cursor-pointer shrink-0"
            >
              Go
            </button>
          </form>

          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setOpenMenu((prev) => (prev === 'related' ? null : 'related'))}
              className="px-2 py-1 netscape-btn flex items-center gap-1 text-xs font-medium text-[#111827] cursor-pointer whitespace-nowrap"
            >
              What&apos;s Related
              <ChevronDown className="w-3 h-3" />
            </button>

            {openMenu === 'related' && (
              <div className="absolute right-0 top-full z-40 mt-0.5 w-60 bg-[#c0c0c0] bevel-out py-1 shadow-lg text-xs">
                <MenuOption
                  label="Netscapeit Netcenter"
                  onClick={() => {
                    setOpenMenu(null);
                    void loadUrl('http://home.netscapeit.com/');
                  }}
                />
                <MenuOption
                  label="AltaVista Xserver Search"
                  onClick={() => {
                    setOpenMenu(null);
                    void loadUrl('http://altavista.xserver.net/');
                  }}
                />
                <MenuOption
                  label="GeoCities Cyberia '99"
                  onClick={() => {
                    setOpenMenu(null);
                    void loadUrl('http://geocities.xserver.net/cyberia/99/');
                  }}
                />
                <MenuOption
                  label="Slashdot '99 Tech News"
                  onClick={() => {
                    setOpenMenu(null);
                    void loadUrl('http://slashdot.xserver.org/');
                  }}
                />
                <MenuOption
                  label="Winamp & Shareware Vault"
                  onClick={() => {
                    setOpenMenu(null);
                    void loadUrl('http://winamp.xserver.com/');
                  }}
                />
                <MenuOption
                  label="Planet 1999 WebRing"
                  onClick={() => {
                    setOpenMenu(null);
                    void loadUrl('http://spacejam.xserver.org/');
                  }}
                />
                <div className="my-1 border-t border-[#808080] border-b border-b-white" />
                <MenuOption
                  label="Live Web: example.com (via Xserver Proxy)"
                  onClick={() => {
                    setOpenMenu(null);
                    void loadUrl('https://example.com');
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* 5. Personal Toolbar (Bookmarks Strip) */}
        {showPersonalBar && (
          <div className="px-2 py-1 border-t border-white border-b border-b-[#808080] flex items-center gap-1 overflow-x-auto text-xs shrink-0">
            <span className="text-[11px] font-semibold text-[#4b5563] pr-1 shrink-0">Personal:</span>
            {bookmarks.map((bm) => (
              <button
                key={bm.id}
                type="button"
                onClick={() => void loadUrl(bm.url)}
                title={bm.url}
                className={`px-2 py-0.5 netscape-btn text-xs text-[#111827] flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0 ${
                  currentPage?.normalizedUrl === bm.url ? 'netscape-btn-active font-semibold' : ''
                }`}
              >
                <FolderOpen className="w-3 h-3 text-[#b45309]" />
                {bm.title}
              </button>
            ))}
            <button
              type="button"
              onClick={handleAddBookmark}
              title="Bookmark Current Page"
              className="ml-auto px-2 py-0.5 netscape-btn text-[11px] text-[#003366] font-semibold flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
            >
              <Plus className="w-3 h-3" />
              Add
            </button>
          </div>
        )}

        {/* 6. Main Document Viewport */}
        <div className="flex-1 min-h-0 p-1 flex flex-col">
          <BrowserViewport
            page={currentPage}
            loading={loading}
            loadProgress={loadProgress}
            textScale={textScale}
            findOpen={findOpen}
            findQuery={findQuery}
            onChangeFindQuery={setFindQuery}
            onCloseFind={() => setFindOpen(false)}
            onNavigate={(url) => void loadUrl(url)}
            onFormSubmit={handleFormSubmit}
            onDownload={handleDownloadTrigger}
            onPlayAudio={handlePlayAudio}
          />
        </div>

        {/* 7. Bottom Communicator Status Bar */}
        <div className="px-1.5 py-1 border-t border-white flex items-center justify-between gap-2 text-[11px] text-[#111827] shrink-0">
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <button
              type="button"
              onClick={() => setActiveModal('headers')}
              title="Inspect Xserver Connection & HTTP Headers"
              className="px-1.5 py-0.5 bevel-in-sm bg-[#c0c0c0] flex items-center gap-1 cursor-pointer shrink-0"
            >
              {currentPage?.isSecure ? (
                <Lock className="w-3 h-3 text-[#15803d]" />
              ) : (
                <LockOpen className="w-3 h-3 text-[#4b5563]" />
              )}
              <span className="font-semibold">Xserver/1.99</span>
            </button>

            <div className="flex-1 min-w-0 px-2 py-0.5 bevel-in-sm bg-[#c0c0c0] truncate tabular-nums">
              {statusText}
            </div>

            {loading && (
              <div className="w-24 h-4 bevel-in-sm bg-white overflow-hidden shrink-0 hidden sm:block">
                <div className="h-full bg-[#000080]" style={{ width: `${loadProgress}%` }} />
              </div>
            )}

            <button
              type="button"
              onClick={() => setActiveModal('preferences')}
              title="Change Modem / Connection Speed"
              className="px-2 py-0.5 bevel-in-sm bg-[#c0c0c0] font-mono-retro cursor-pointer shrink-0 hidden md:inline-block"
            >
              {connectionSpeed === '56k'
                ? '56k V.90'
                : connectionSpeed === 'isdn'
                ? '128k ISDN'
                : 'T1 LAN'}
            </button>

            {playingTrack && (
              <button
                type="button"
                onClick={() => handlePlayAudio('stop')}
                title="Click to stop MIDI audio"
                className="px-2 py-0.5 bevel-in-sm bg-[#fef3c7] text-[#92400e] flex items-center gap-1 cursor-pointer shrink-0"
              >
                <Volume2 className="w-3 h-3" />
                <span>Stop {playingTrack}</span>
              </button>
            )}
          </div>

          {/* Classic Communicator Suite Quick-Switch Dock */}
          <div className="bevel-in-sm px-1.5 py-0.5 flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => void loadUrl(HOME_URL)}
              title="Navigator (Netcenter)"
              aria-label="Navigator Home"
              className="hover:text-[#000080] cursor-pointer"
            >
              <Home className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => void loadUrl('http://xserver.local/')}
              title="Xserver Control Console"
              aria-label="Xserver Console"
              className="hover:text-[#000080] cursor-pointer"
            >
              <Server className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => void loadUrl('http://webmaster.xserver.local/builder.html')}
              title="Netscapeit Composer"
              aria-label="Composer"
              className="hover:text-[#000080] cursor-pointer"
            >
              <FileCode2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setActiveModal('bookmarks')}
              title="Bookmarks"
              aria-label="Bookmarks"
              className="hover:text-[#000080] cursor-pointer"
            >
              <Bookmark className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Modals & Download Dialog */}
      <BrowserModals
        activeModal={activeModal}
        onClose={() => setActiveModal(null)}
        page={currentPage}
        connectionSpeed={connectionSpeed}
        onChangeSpeed={setConnectionSpeed}
        textScale={textScale}
        onChangeTextScale={setTextScale}
        bookmarks={bookmarks}
        onNavigate={(url) => void loadUrl(url)}
        onRemoveBookmark={(id) =>
          setBookmarks((prev) => prev.filter((item) => item.id !== id))
        }
        onAddCurrentBookmark={handleAddBookmark}
        onClearHistory={() => {
          setHistory(currentPage ? [{ url: currentPage.normalizedUrl, title: currentPage.title, visitedAt: Date.now() }] : []);
          setHistoryIndex(currentPage ? 0 : -1);
          setStatusText('Session history cleared.');
        }}
        downloadJob={downloadJob}
        onDismissDownload={() => setDownloadJob(null)}
        onSaveDownloadedFile={handleSaveDownloadedFile}
      />
    </div>
  );
}

const ToolbarButton: React.FC<{
  icon: React.ReactNode;
  label: string;
  disabled?: boolean;
  onClick: () => void;
}> = ({ icon, label, disabled, onClick }) => (
  <button
    type="button"
    disabled={disabled}
    onClick={onClick}
    className={`px-2 py-1 min-w-[48px] flex flex-col items-center justify-center gap-0.5 text-[11px] netscape-btn whitespace-nowrap shrink-0 ${
      disabled ? 'opacity-45 cursor-default' : 'cursor-pointer text-[#111827]'
    }`}
  >
    {icon}
    <span className="leading-none">{label}</span>
  </button>
);

const MenuOption: React.FC<{
  label: string;
  shortcut?: string;
  disabled?: boolean;
  onClick: () => void;
}> = ({ label, shortcut, disabled, onClick }) => (
  <button
    type="button"
    disabled={disabled}
    onClick={onClick}
    className={`w-full px-3 py-1.5 text-left flex items-center justify-between gap-4 ${
      disabled
        ? 'text-[#6b7280] cursor-default'
        : 'hover:bg-[#000080] hover:text-white cursor-pointer'
    }`}
  >
    <span className="truncate">{label}</span>
    {shortcut && <span className="text-[10px] opacity-75 shrink-0">{shortcut}</span>}
  </button>
);
