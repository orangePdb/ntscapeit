import React, { useCallback, useEffect, useState } from 'react';
import { RefreshCw, Server, Globe, FileCode2, ExternalLink } from 'lucide-react';
import type { XserverStatus } from '../types/browser';

interface XserverConsoleViewProps {
  onNavigate: (url: string) => void;
}

export const XserverConsoleView: React.FC<XserverConsoleViewProps> = ({ onNavigate }) => {
  const [status, setStatus] = useState<XserverStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [logFilter, setLogFilter] = useState<string>('');

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/xserver/status');
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = (await res.json()) as XserverStatus;
      setStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to reach Xserver');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchStatus();
  }, [fetchStatus]);

  const filteredLogs = (status?.recentLogs || []).filter((log) => {
    if (!logFilter.trim()) return true;
    const q = logFilter.toLowerCase();
    return (
      log.host.toLowerCase().includes(q) ||
      log.path.toLowerCase().includes(q) ||
      String(log.status).includes(q) ||
      log.method.toLowerCase().includes(q)
    );
  });

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  const formatUptime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
  };

  return (
    <div className="min-h-full bg-[#f5f6f8] text-[#111827] p-6" style={{ fontFamily: '"Public Sans", Verdana, sans-serif' }}>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Console Header */}
        <div className="bg-[#003366] text-white p-4 border border-[#002244] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#104e8b] border border-[#6699cc] flex items-center justify-center">
              <Server className="w-5 h-5 text-[#ffcc00]" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Xserver/1.99 Administration Console</h1>
              <p className="text-xs text-[#bfd8f2]">
                {status ? `${status.protocol} · Listening on port 3000` : 'Connecting to Xserver daemon...'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigate('http://webmaster.xserver.local/builder.html')}
              className="px-3 py-1.5 text-xs font-semibold text-[#111827] netscape-raised-btn cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5"
            >
              <FileCode2 className="w-3.5 h-3.5" />
              Publish New Page
            </button>
            <button
              type="button"
              onClick={() => void fetchStatus()}
              disabled={loading}
              className="px-3 py-1.5 text-xs font-semibold text-[#111827] netscape-raised-btn cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh Logs
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-[#fef2f2] border border-[#dc2626] text-[#991b1b] p-3 text-sm">
            Failed to query Xserver status: {error}
          </div>
        )}

        {/* KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-[#cbd5e1] p-4">
            <div className="text-xs text-[#475569] font-medium">Server Daemon</div>
            <div className="text-lg font-bold text-[#0f172a] mt-1 tabular-nums">
              {status ? `${status.serverName}/${status.version}` : '—'}
            </div>
          </div>
          <div className="bg-white border border-[#cbd5e1] p-4">
            <div className="text-xs text-[#475569] font-medium">Uptime</div>
            <div className="text-lg font-bold text-[#0f172a] mt-1 font-mono-retro tabular-nums">
              {status ? formatUptime(status.uptimeSeconds) : '—'}
            </div>
          </div>
          <div className="bg-white border border-[#cbd5e1] p-4">
            <div className="text-xs text-[#475569] font-medium">Total HTTP Requests</div>
            <div className="text-lg font-bold text-[#0f172a] mt-1 font-mono-retro tabular-nums">
              {status ? status.totalRequests.toLocaleString() : '—'}
            </div>
          </div>
          <div className="bg-white border border-[#cbd5e1] p-4">
            <div className="text-xs text-[#475569] font-medium">Payload Served</div>
            <div className="text-lg font-bold text-[#0f172a] mt-1 font-mono-retro tabular-nums">
              {status ? formatBytes(status.totalBytesServed) : '—'}
            </div>
          </div>
        </div>

        {/* Virtual Hosts Directory */}
        <div className="bg-white border border-[#cbd5e1]">
          <div className="px-4 py-2.5 bg-[#e2e8f0] border-b border-[#cbd5e1] flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#0f172a] flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#003366]" />
              Active Virtual Hosts on Xserver
            </h2>
            <span className="text-xs text-[#475569] tabular-nums">
              {status ? `${status.virtualHosts.length} hosts configured` : ''}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#f8fafc] border-b border-[#e2e8f0] text-[#475569]">
                  <th className="py-2 px-3 font-semibold">Virtual Host</th>
                  <th className="py-2 px-3 font-semibold">Description</th>
                  <th className="py-2 px-3 font-semibold">CGI-BIN / Endpoints</th>
                  <th className="py-2 px-3 font-semibold text-right">Hits</th>
                  <th className="py-2 px-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {(status?.virtualHosts || []).map((vh) => (
                  <tr key={vh.host} className="border-b border-[#e2e8f0] hover:bg-[#f1f5f9]">
                    <td className="py-2 px-3 font-mono-retro font-semibold text-[#003366]">{vh.host}</td>
                    <td className="py-2 px-3 text-[#334155]">{vh.description}</td>
                    <td className="py-2 px-3 font-mono-retro text-[#475569]">
                      {vh.cgiScripts.length > 0 ? vh.cgiScripts.join(', ') : 'Static HTML'}
                    </td>
                    <td className="py-2 px-3 text-right font-mono-retro tabular-nums">{vh.hits.toLocaleString()}</td>
                    <td className="py-2 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => onNavigate(vh.defaultUrl)}
                        className="text-[#0000cc] hover:underline font-medium inline-flex items-center gap-1 cursor-pointer"
                      >
                        Browse
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Member Pages Hosted on Xserver */}
        <div className="bg-white border border-[#cbd5e1]">
          <div className="px-4 py-2.5 bg-[#e2e8f0] border-b border-[#cbd5e1] flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#0f172a]">Member HTML Pages (Published via Composer)</h2>
            <button
              type="button"
              onClick={() => onNavigate('http://webmaster.xserver.local/builder.html')}
              className="text-xs text-[#0000cc] hover:underline font-medium cursor-pointer"
            >
              + Create Page
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#f8fafc] border-b border-[#e2e8f0] text-[#475569]">
                  <th className="py-2 px-3 font-semibold">Slug</th>
                  <th className="py-2 px-3 font-semibold">Title</th>
                  <th className="py-2 px-3 font-semibold">Author</th>
                  <th className="py-2 px-3 font-semibold text-right">Hits</th>
                  <th className="py-2 px-3 font-semibold text-right">Open</th>
                </tr>
              </thead>
              <tbody>
                {(status?.userPages || []).map((page) => {
                  const pageUrl = `http://xserver.local/pages/${encodeURIComponent(page.slug)}`;
                  return (
                    <tr key={page.slug} className="border-b border-[#e2e8f0] hover:bg-[#f1f5f9]">
                      <td className="py-2 px-3 font-mono-retro text-[#334155]">/pages/{page.slug}</td>
                      <td className="py-2 px-3 font-medium text-[#0f172a]">{page.title}</td>
                      <td className="py-2 px-3 text-[#475569]">{page.author}</td>
                      <td className="py-2 px-3 text-right font-mono-retro tabular-nums">{page.hits}</td>
                      <td className="py-2 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => onNavigate(pageUrl)}
                          className="text-[#0000cc] hover:underline font-medium cursor-pointer"
                        >
                          Open URL
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live HTTP Access Log */}
        <div className="bg-white border border-[#cbd5e1]">
          <div className="px-4 py-2.5 bg-[#e2e8f0] border-b border-[#cbd5e1] flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-[#0f172a]">Xserver Live HTTP Access Log</h2>
            <input
              type="text"
              value={logFilter}
              onChange={(e) => setLogFilter(e.target.value)}
              placeholder="Filter host, path, or status..."
              aria-label="Filter HTTP access log"
              className="px-2 py-1 text-xs bg-white border border-[#94a3b8] w-56 focus:outline-none focus:border-[#003366]"
            />
          </div>
          <div className="overflow-x-auto max-h-72 overflow-y-auto">
            <table className="w-full text-left border-collapse text-xs font-mono-retro">
              <thead className="sticky top-0 bg-[#f8fafc] border-b border-[#e2e8f0] text-[#475569]">
                <tr>
                  <th className="py-2 px-3">Time</th>
                  <th className="py-2 px-3">Method</th>
                  <th className="py-2 px-3">Host</th>
                  <th className="py-2 px-3">Path</th>
                  <th className="py-2 px-3 text-right">Status</th>
                  <th className="py-2 px-3 text-right">Bytes</th>
                  <th className="py-2 px-3 text-right">Latency</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-[#64748b] font-sans">
                      No matching HTTP requests logged yet.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="border-b border-[#f1f5f9] hover:bg-[#f8fafc]">
                      <td className="py-1.5 px-3 tabular-nums text-[#475569]">{log.timestamp}</td>
                      <td className="py-1.5 px-3 font-semibold text-[#0f172a]">{log.method}</td>
                      <td className="py-1.5 px-3 text-[#003366]">{log.host}</td>
                      <td className="py-1.5 px-3 text-[#334155] max-w-xs truncate">{log.path}</td>
                      <td
                        className={`py-1.5 px-3 text-right tabular-nums font-semibold ${
                          log.status >= 400 ? 'text-[#dc2626]' : 'text-[#15803d]'
                        }`}
                      >
                        {log.status}
                      </td>
                      <td className="py-1.5 px-3 text-right tabular-nums text-[#475569]">{log.bytes}</td>
                      <td className="py-1.5 px-3 text-right tabular-nums text-[#475569]">{log.elapsedMs}ms</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
