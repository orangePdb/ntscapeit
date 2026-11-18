import React, { useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import type { BrowserResponse } from '../types/browser';
import { XserverConsoleView } from './XserverConsoleView';
import { ComposerView } from './ComposerView';

interface BrowserViewportProps {
  page: BrowserResponse | null;
  loading: boolean;
  loadProgress: number;
  textScale: 'small' | 'normal' | 'large';
  findOpen: boolean;
  findQuery: string;
  onChangeFindQuery: (q: string) => void;
  onCloseFind: () => void;
  onNavigate: (url: string) => void;
  onFormSubmit: (payload: {
    action: string;
    method: string;
    data: Record<string, string>;
    currentUrl: string;
  }) => void;
  onDownload: (filename: string, sizeKb: number, url: string) => void;
  onPlayAudio: (track: string) => void;
}

export const BrowserViewport: React.FC<BrowserViewportProps> = ({
  page,
  loading,
  loadProgress,
  textScale,
  findOpen,
  findQuery,
  onChangeFindQuery,
  onCloseFind,
  onNavigate,
  onFormSubmit,
  onDownload,
  onPlayAudio,
}) => {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const msg = event.data;
      if (!msg || typeof msg !== 'object') return;
      if (msg.type === 'netscapeit:navigate' && typeof msg.url === 'string') {
        onNavigate(msg.url);
      } else if (msg.type === 'netscapeit:form') {
        onFormSubmit({
          action: String(msg.action || ''),
          method: String(msg.method || 'GET'),
          data: (msg.data as Record<string, string>) || {},
          currentUrl: String(msg.currentUrl || ''),
        });
      } else if (msg.type === 'netscapeit:download') {
        onDownload(
          String(msg.filename || 'file.txt'),
          Number(msg.sizeKb || 32),
          String(msg.url || '')
        );
      } else if (msg.type === 'netscapeit:audio') {
        onPlayAudio(String(msg.track || 'stop'));
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [onNavigate, onFormSubmit, onDownload, onPlayAudio]);

  const scaleCss =
    textScale === 'small' ? '90%' : textScale === 'large' ? '115%' : '100%';

  const styledHtml = React.useMemo(() => {
    if (!page) return '';
    if (textScale === 'normal') return page.html;
    const zoomRule = `<style>html { font-size: ${scaleCss}; }</style>`;
    return page.html.includes('</head>')
      ? page.html.replace('</head>', `${zoomRule}</head>`)
      : `${zoomRule}${page.html}`;
  }, [page, textScale, scaleCss]);

  const handleFindNext = () => {
    const win = iframeRef.current?.contentWindow as (Window & { find?: (str: string) => boolean }) | null;
    if (win && typeof win.find === 'function' && findQuery.trim()) {
      win.find(findQuery);
    }
  };

  return (
    <div className="relative flex-1 min-h-0 flex flex-col bg-white bevel-in overflow-hidden">
      {/* Find in Page Bar */}
      {findOpen && (
        <div className="bg-[#c0c0c0] border-b border-[#808080] px-3 py-1.5 flex items-center gap-2 text-xs shrink-0">
          <Search className="w-3.5 h-3.5 text-[#374151]" />
          <span className="font-semibold text-[#111827]">Find in Page:</span>
          <input
            type="text"
            value={findQuery}
            onChange={(e) => onChangeFindQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleFindNext();
              if (e.key === 'Escape') onCloseFind();
            }}
            autoFocus
            placeholder="Search text..."
            className="px-2 py-0.5 bg-white bevel-in-sm text-xs w-52 focus:outline-none"
          />
          <button
            type="button"
            onClick={handleFindNext}
            className="px-2.5 py-0.5 netscape-raised-btn text-xs cursor-pointer"
          >
            Find Next
          </button>
          <button
            type="button"
            onClick={onCloseFind}
            aria-label="Close find bar"
            className="ml-auto p-0.5 netscape-btn cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Progressive 56k loading curtain */}
      {loading && (
        <div className="absolute inset-0 z-20 bg-white/85 flex flex-col items-center justify-center p-6 pointer-events-none">
          <div className="bg-[#c0c0c0] bevel-out p-4 w-72 text-xs space-y-2 shadow-md">
            <div className="font-bold text-[#003366]">Contacting Xserver/1.99...</div>
            <div className="w-full h-3.5 bg-white bevel-in-sm overflow-hidden">
              <div
                className="h-full bg-[#000080] transition-all duration-150"
                style={{ width: `${loadProgress}%` }}
              />
            </div>
            <div className="text-[11px] text-[#374151] tabular-nums">
              Receiving data... {loadProgress}%
            </div>
          </div>
        </div>
      )}

      {/* Viewport Content */}
      {!page ? (
        <div className="flex-1 flex items-center justify-center text-sm text-[#4b5563]">
          Connecting to Xserver...
        </div>
      ) : page.mode === 'xserver-console' ? (
        <div className="flex-1 overflow-y-auto">
          <XserverConsoleView onNavigate={onNavigate} />
        </div>
      ) : page.mode === 'composer' ? (
        <div className="flex-1 overflow-y-auto">
          <ComposerView onNavigate={onNavigate} />
        </div>
      ) : (
        <iframe
          ref={iframeRef}
          title={page.title}
          sandbox="allow-scripts allow-forms"
          srcDoc={styledHtml}
          className="w-full flex-1 border-0 bg-white"
        />
      )}
    </div>
  );
};
