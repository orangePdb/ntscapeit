import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import { TvStandbyScreen } from './components/TvStandbyScreen';
import { IntroAnimation } from './components/IntroAnimation';
import type { ActiveModalType } from './components/BrowserModals';
import {
  BackIcon,
  BookmarksRibbonIcon,
  ComposerIcon,
  FolderSmallIcon,
  ForwardIcon,
  HomeIcon,
  MyNetscapeIcon,
  PageSmallIcon,
  PrintIcon,
  ReloadIcon,
  SearchIcon,
  SecurityIcon,
  StopIcon,
  XserverIcon,
  YouTubeRetroIcon,
} from './components/NavigatorIcons';
import { playMidiTrack, stopRetroAudio } from './utils/retroAudio';

const HOME_URL = 'http://home.netscapeit.com/';

const DEFAULT_BOOKMARKS: BookmarkItem[] = [
  { id: 'bm-1', title: 'Netcenter', url: 'http://home.netscapeit.com/' },
  { id: 'bm-yt', title: 'YouTube 1999', url: 'http://youtube.xserver.net/' },
  { id: 'bm-2', title: 'Xserver', url: 'http://xserver.local/' },
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
  const [introDone, setIntroDone] = useState<boolean>(false);
  const [introKey, setIntroKey] = useState<number>(0);
  const [appClosed, setAppClosed] = useState<boolean>(false);

  const [openMenu, setOpenMenu] = useState<MenuKey>(null);
  const [activeModal, setActiveModal] = useState<ActiveModalType>(null);
  const [findOpen, setFindOpen] = useState<boolean>(false);
  const [findQuery, setFindQuery] = useState<string>('');
  const [playingTrack, setPlayingTrack] = useState<string | null>(null);
  const [downloadJob, setDownloadJob] = useState<DownloadJob | null>(null);

  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>(() => {
    try {
      const saved = localStorage.getItem('netscapeit_bookmarks_v2');
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
      localStorage.setItem('netscapeit_bookmarks_v2', JSON.stringify(bookmarks));
    } catch {
      // Ignore storage errors
    }
  }, [bookmarks]);

  useEffect(() => {
    if (!introDone || appClosed) return;
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
  }, [introDone, appClosed]);

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
          `Document: Done (${(data.bytes / 1024).toFixed(1)} KB, ${data.elapsedMs}ms via Xserver/1.99)`
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
          setStatusText('Document: Stopped.');
          return;
        }
        setLoading(false);
        setStatusText('Error: Unable to reach Xserver.');
      }
    },
    [connectionSpeed, historyIndex]
  );

  useEffect(() => {
    void loadUrl(HOME_URL, { pushHistory: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const handleCloseApp = useCallback(() => {
    clearSimTimer();
    abortRef.current?.abort();
    stopRetroAudio();
    setPlayingTrack(null);
    setLoading(false);
    setOpenMenu(null);
    setActiveModal(null);
    setFindOpen(false);
    setAppClosed(true);
  }, []);

  const handleFactoryReset = useCallback(() => {
    clearSimTimer();
    abortRef.current?.abort();
    stopRetroAudio();
    try {
      localStorage.removeItem('netscapeit_bookmarks_v2');
    } catch {
      // Ignore storage errors
    }
    setBookmarks(DEFAULT_BOOKMARKS);
    setConnectionSpeed('t1');
    setTextScale('normal');
    setShowPersonalBar(true);
    setWindowedMode(false);
    setHistory([]);
    setHistoryIndex(-1);
    setCurrentPage(null);
    setLocationInput(HOME_URL);
    setLoading(false);
    setLoadProgress(100);
    setStatusText('Document: Done');
    setOpenMenu(null);
    setActiveModal(null);
    setFindOpen(false);
    setFindQuery('');
    setPlayingTrack(null);
    setDownloadJob(null);
    setAppClosed(false);
    setIntroKey((k) => k + 1);
    setIntroDone(false);

    void fetch('/api/xserver/factory-reset', { method: 'POST' })
      .catch(() => {})
      .finally(() => {
        void loadUrl(HOME_URL, { pushHistory: true });
      });
  }, [loadUrl]);

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
    const content = `Downloaded from Xserver/1.99 via Netscape Navigator 4.72 [netscapeit]\nFile: ${job.filename}\nSource: ${job.url}\nSize: ${job.totalKb} KB\nDate: 1999-11-18\n`;
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

  if (!introDone) {
    return <IntroAnimation key={introKey} onComplete={() => setIntroDone(true)} />;
  }

  if (appClosed) {
    return <TvStandbyScreen />;
  }

  return (
    <div
      className={`h-screen w-screen bg-[#008080] flex flex-col overflow-hidden ${
        windowedMode ? 'p-4 md:p-6' : 'p-0'
      }`}
    >
      {/* Main Netscape Navigator 4.72 Window */}
      <div className="flex-1 min-h-0 flex flex-col bg-[#c0c0c0] bevel-out overflow-hidden">
        {/* 1. Classic Netscape Navigator 4.72 Title Bar */}
        <div
          className="h-6 px-1.5 flex items-center justify-between text-white shrink-0"
          style={{ background: 'linear-gradient(90deg, #000080 0%, #1084d0 100%)' }}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <div
              className="w-4 h-4 bg-[#001429] border border-[#6699cc] flex items-center justify-center text-[11px] font-bold leading-none shrink-0"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              N
            </div>
            <span className="text-xs font-bold truncate">
              {currentPage
                ? `${currentPage.title} - Netscape [netscapeit 4.72]`
                : 'Netscape Navigator 4.72 [netscapeit]'}
            </span>
          </div>

          <div className="flex items-center gap-0.5 shrink-0">
            <button
              type="button"
              onClick={() => setWindowedMode((v) => !v)}
              title={windowedMode ? 'Maximize' : 'Restore Window'}
              aria-label={windowedMode ? 'Maximize Window' : 'Restore Window'}
              className="w-4 h-4 bg-[#c0c0c0] text-black bevel-out-sm text-[10px] font-bold flex items-center justify-center cursor-pointer leading-none"
            >
              {windowedMode ? '□' : '❐'}
            </button>
            <button
              type="button"
              onClick={handleCloseApp}
              title="Close"
              aria-label="Close"
              className="w-4 h-4 bg-[#c0c0c0] text-black bevel-out-sm text-[10px] font-bold flex items-center justify-center cursor-pointer leading-none"
            >
              ×
            </button>
          </div>
        </div>

        {/* 2. Menu Bar */}
        <div
          className="relative px-1 py-0.5 border-b border-[#808080] flex items-center gap-0.5 text-xs text-[#000000] shrink-0"
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
                <u>{m.label[0]}</u>{m.label.slice(1)}
              </button>

              {openMenu === m.key && (
                <div className="absolute left-0 top-full z-40 mt-0.5 min-w-[220px] bg-[#c0c0c0] bevel-out py-1 shadow-[2px_2px_0_#000000] text-xs text-[#000000]">
                  {m.key === 'file' && (
                    <>
                      <MenuOption
                        label="Open Page..."
                        shortcut="Ctrl+L"
                        onClick={() => {
                          setOpenMenu(null);
                          locationInputRef.current?.focus();
                          locationInputRef.current?.select();
                        }}
                      />
                      <MenuOption
                        label="Save As (.html)..."
                        onClick={() => {
                          setOpenMenu(null);
                          handleSaveCurrentHtml();
                        }}
                      />
                      <MenuOption
                        label="Print..."
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
                      <div className="my-1 border-t border-[#808080] border-b border-b-white" />
                      <MenuOption
                        label="Exit"
                        onClick={handleCloseApp}
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
                        label="Page Info / Xserver Headers..."
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
                          label={item.title.slice(0, 30)}
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
                        label="Navigator (Netcenter)"
                        onClick={() => {
                          setOpenMenu(null);
                          void loadUrl(HOME_URL);
                        }}
                      />
                      <MenuOption
                        label="YouTube 1999 Gateway"
                        onClick={() => {
                          setOpenMenu(null);
                          void loadUrl('http://youtube.xserver.net/');
                        }}
                      />
                      <MenuOption
                        label="Xserver/1.99 Control Console"
                        onClick={() => {
                          setOpenMenu(null);
                          void loadUrl('http://xserver.local/');
                        }}
                      />
                      <MenuOption
                        label="Composer (HTML Editor)"
                        onClick={() => {
                          setOpenMenu(null);
                          void loadUrl('http://webmaster.xserver.local/builder.html');
                        }}
                      />
                      <MenuOption
                        label="Bookmarks..."
                        onClick={() => {
                          setOpenMenu(null);
                          setActiveModal('bookmarks');
                        }}
                      />
                      {playingTrack && (
                        <MenuOption
                          label={`Stop MIDI (${playingTrack})`}
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
                        label="About Netscape Navigator 4.72..."
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

        {/* 3. Authentic Netscape Navigator 4.72 Navigation Toolbar */}
        <div className="px-1.5 py-1 border-t border-white border-b border-b-[#808080] flex items-center justify-between gap-2 shrink-0 overflow-x-auto">
          <div className="flex items-center gap-0.5">
            {/* Classic 1999 Toolbar Drag Grip */}
            <div className="w-1.5 h-9 border-l border-white border-r border-[#808080] mr-1 shrink-0" />

            <ToolbarButton
              icon={<BackIcon />}
              label="Back"
              disabled={!canBack}
              onClick={handleBack}
            />
            <ToolbarButton
              icon={<ForwardIcon />}
              label="Forward"
              disabled={!canForward}
              onClick={handleForward}
            />
            <ToolbarButton
              icon={<ReloadIcon />}
              label="Reload"
              onClick={handleReload}
            />
            <ToolbarButton
              icon={<HomeIcon />}
              label="Home"
              onClick={() => void loadUrl(HOME_URL)}
            />
            <div className="w-px h-9 bg-[#808080] border-r border-white mx-0.5 shrink-0" />
            <ToolbarButton
              icon={<SearchIcon />}
              label="Search"
              onClick={() => void loadUrl('http://altavista.xserver.net/')}
            />
            <ToolbarButton
              icon={<MyNetscapeIcon />}
              label="My Netscape"
              onClick={() => void loadUrl('http://spacejam.xserver.org/')}
            />
            <ToolbarButton
              icon={<YouTubeRetroIcon />}
              label="YouTube"
              onClick={() => void loadUrl('http://youtube.xserver.net/')}
            />
            <ToolbarButton
              icon={<PrintIcon />}
              label="Print"
              onClick={() => window.print()}
            />
            <ToolbarButton
              icon={<SecurityIcon locked={currentPage?.isSecure} />}
              label="Security"
              onClick={() => setActiveModal('headers')}
            />
            <ToolbarButton
              icon={<StopIcon />}
              label="Stop"
              onClick={handleStop}
            />
          </div>

          <NetscapeThrobber loading={loading} onClick={() => void loadUrl(HOME_URL)} />
        </div>

        {/* 4. Location Toolbar */}
        <div
          className="px-1.5 py-1 border-t border-white border-b border-b-[#808080] flex items-center gap-1.5 text-xs shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-1.5 h-5 border-l border-white border-r border-[#808080] shrink-0" />

          <button
            type="button"
            onClick={() => setActiveModal('bookmarks')}
            className="px-1.5 py-0.5 netscape-btn flex items-center gap-1 text-[#000000] cursor-pointer whitespace-nowrap shrink-0"
          >
            <BookmarksRibbonIcon />
            <span>Bookmarks</span>
          </button>

          <form onSubmit={handleLocationSubmit} className="flex-1 flex items-center gap-1.5 min-w-0">
            <label htmlFor="location-bar" className="text-[#000000] shrink-0">
              Location:
            </label>
            <div className="flex-1 min-w-0 flex items-center bg-white bevel-in-sm px-1.5 py-0.5 gap-1.5">
              <PageSmallIcon className="w-3.5 h-3.5 shrink-0" />
              <input
                id="location-bar"
                ref={locationInputRef}
                type="text"
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                placeholder="http://home.netscapeit.com/"
                className="flex-1 min-w-0 bg-transparent text-xs font-mono-retro text-[#000000] focus:outline-none select-text"
              />
            </div>
            <button
              type="submit"
              className="px-2.5 py-0.5 netscape-raised-btn text-xs font-bold text-[#000000] cursor-pointer shrink-0"
            >
              Go
            </button>
          </form>

          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setOpenMenu((prev) => (prev === 'related' ? null : 'related'))}
              className="px-2 py-0.5 netscape-btn flex items-center gap-1 text-xs text-[#000000] cursor-pointer whitespace-nowrap"
            >
              <span>What&apos;s Related</span>
              <span className="text-[9px]">▼</span>
            </button>

            {openMenu === 'related' && (
              <div className="absolute right-0 top-full z-40 mt-0.5 w-64 bg-[#c0c0c0] bevel-out py-1 shadow-[2px_2px_0_#000000] text-xs">
                <MenuOption
                  label="YouTube 1999 Gateway"
                  onClick={() => {
                    setOpenMenu(null);
                    void loadUrl('http://youtube.xserver.net/');
                  }}
                />
                <MenuOption
                  label="YouTube: Me at the zoo (2005)"
                  onClick={() => {
                    setOpenMenu(null);
                    void loadUrl('https://www.youtube.com/watch?v=jNQXAC9IVRw');
                  }}
                />
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
                  label="Xserver Control Console"
                  onClick={() => {
                    setOpenMenu(null);
                    void loadUrl('http://xserver.local/');
                  }}
                />
                <div className="my-1 border-t border-[#808080] border-b border-b-white" />
                <MenuOption
                  label="google.com (2006 Wayback)"
                  onClick={() => {
                    setOpenMenu(null);
                    void loadUrl('https://www.google.com/');
                  }}
                />
                <MenuOption
                  label="yahoo.com (2006 Wayback)"
                  onClick={() => {
                    setOpenMenu(null);
                    void loadUrl('https://www.yahoo.com/');
                  }}
                />
                <MenuOption
                  label="youtube.com (2006 Wayback)"
                  onClick={() => {
                    setOpenMenu(null);
                    void loadUrl('https://www.youtube.com/');
                  }}
                />
                <MenuOption
                  label="example.com (Wayback / Live)"
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
          <div className="px-1.5 py-0.5 border-t border-white border-b border-b-[#808080] flex items-center gap-1 overflow-x-auto text-xs shrink-0">
            <div className="w-1.5 h-5 border-l border-white border-r border-[#808080] mr-0.5 shrink-0" />
            {bookmarks.map((bm) => (
              <button
                key={bm.id}
                type="button"
                onClick={() => void loadUrl(bm.url)}
                title={bm.url}
                className={`px-1.5 py-0.5 netscape-btn text-xs text-[#000000] flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0 ${
                  currentPage?.normalizedUrl === bm.url ? 'netscape-btn-active font-bold' : ''
                }`}
              >
                <FolderSmallIcon />
                {bm.title}
              </button>
            ))}
            <button
              type="button"
              onClick={handleAddBookmark}
              title="Bookmark Current Page"
              className="ml-auto px-2 py-0.5 netscape-btn text-[11px] text-[#000080] font-bold cursor-pointer whitespace-nowrap shrink-0"
            >
              + Add Bookmark
            </button>
          </div>
        )}

        {/* 6. Main Document Viewport */}
        <div className="flex-1 min-h-0 p-0.5 flex flex-col">
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

        {/* 7. Classic Netscape Navigator 4.72 Bottom Status Bar */}
        <div className="px-1 py-0.5 border-t border-white flex items-center justify-between gap-1 text-[11px] text-[#000000] shrink-0">
          <div className="flex items-center gap-1 flex-1 min-w-0">
            <button
              type="button"
              onClick={() => setActiveModal('headers')}
              title="Security & Xserver Connection Info"
              className="px-1.5 py-0.5 bevel-in-sm bg-[#c0c0c0] flex items-center gap-1 cursor-pointer shrink-0"
            >
              <SecurityIcon className="w-3.5 h-3.5" locked={currentPage?.isSecure} />
              <span className="font-bold">Xserver/1.99</span>
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
                className="px-2 py-0.5 bevel-in-sm bg-[#ffffcc] text-[#663300] font-bold cursor-pointer shrink-0"
              >
                Stop {playingTrack}
              </button>
            )}
          </div>

          {/* Classic Communicator 4.72 Component Bar */}
          <div className="bevel-in-sm px-1 py-0.5 flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => void loadUrl(HOME_URL)}
              title="Navigator (Netcenter)"
              aria-label="Navigator Home"
              className="cursor-pointer p-0.5 hover:bg-[#d4d0c8]"
            >
              <MyNetscapeIcon className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => void loadUrl('http://youtube.xserver.net/')}
              title="YouTube 1999 Gateway"
              aria-label="YouTube 1999"
              className="cursor-pointer p-0.5 hover:bg-[#d4d0c8]"
            >
              <YouTubeRetroIcon className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => void loadUrl('http://xserver.local/')}
              title="Xserver Control Console"
              aria-label="Xserver Console"
              className="cursor-pointer p-0.5 hover:bg-[#d4d0c8]"
            >
              <XserverIcon className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => void loadUrl('http://webmaster.xserver.local/builder.html')}
              title="Netscape Composer"
              aria-label="Composer"
              className="cursor-pointer p-0.5 hover:bg-[#d4d0c8]"
            >
              <ComposerIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

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
        onFactoryReset={handleFactoryReset}
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
    className={`px-2 py-0.5 min-w-[50px] flex flex-col items-center justify-center gap-0.5 text-[11px] netscape-btn whitespace-nowrap shrink-0 ${
      disabled ? 'opacity-45 cursor-default' : 'cursor-pointer text-[#000000]'
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
    className={`w-full px-3 py-1 text-left flex items-center justify-between gap-4 ${
      disabled
        ? 'text-[#666666] cursor-default'
        : 'hover:bg-[#000080] hover:text-white cursor-pointer'
    }`}
  >
    <span className="truncate">{label}</span>
    {shortcut && <span className="text-[10px] opacity-80 shrink-0">{shortcut}</span>}
  </button>
);
