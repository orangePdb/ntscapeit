import React, { useCallback, useEffect, useState } from 'react';
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
    <div className="min-h-full bg-[#ffffff] text-[#000000] p-4" style={{ fontFamily: 'Verdana, Arial, sans-serif' }}>
      <div className="max-w-5xl mx-auto space-y-4">
        {/* Classic 1999 Netscape Enterprise / Xserver Banner */}
        <table className="w-full border-collapse border border-[#003366]">
          <tbody>
            <tr className="bg-[#003366] text-white">
              <td className="p-2.5">
                <div className="text-base font-bold">Xserver/1.99 Enterprise Administration Server</div>
                <div className="text-xs text-[#ccccff]">
                  {status ? `${status.protocol} — Port 3000` : 'Connecting to Xserver daemon...'}
                </div>
              </td>
              <td className="p-2.5 text-right whitespace-nowrap">
                <button
                  type="button"
                  onClick={() => onNavigate('http://webmaster.xserver.local/builder.html')}
                  className="px-2.5 py-1 text-xs font-bold text-[#000000] netscape-raised-btn cursor-pointer mr-2"
                >
                  Open Composer
                </button>
                <button
                  type="button"
                  onClick={() => void fetchStatus()}
                  disabled={loading}
                  className="px-2.5 py-1 text-xs font-bold text-[#000000] netscape-raised-btn cursor-pointer"
                >
                  {loading ? 'Refreshing...' : 'Refresh Logs'}
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        {error && (
          <div className="bg-[#fff0f0] border border-[#cc0000] text-[#990000] p-2 text-xs">
            <b>Error:</b> Failed to query Xserver status ({error})
          </div>
        )}

        {/* Classic 1999 Status Summary Table */}
        <table className="w-full border-collapse border border-[#808080] text-xs bg-[#f0f0f0]">
          <tbody>
            <tr>
              <td className="border border-[#808080] p-2">
                <b>Server:</b> {status ? `${status.serverName}/${status.version}` : '—'}
              </td>
              <td className="border border-[#808080] p-2 font-mono-retro tabular-nums">
                <b>Uptime:</b> {status ? formatUptime(status.uptimeSeconds) : '—'}
              </td>
              <td className="border border-[#808080] p-2 font-mono-retro tabular-nums">
                <b>Requests:</b> {status ? status.totalRequests.toLocaleString() : '—'}
              </td>
              <td className="border border-[#808080] p-2 font-mono-retro tabular-nums">
                <b>Bytes Sent:</b> {status ? formatBytes(status.totalBytesServed) : '—'}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Virtual Hosts Directory Table */}
        <table className="w-full border-collapse border border-[#808080] text-xs">
          <thead>
            <tr className="bg-[#336699] text-white">
              <th colSpan={5} className="p-1.5 text-left font-bold">
                Active Virtual Hosts on Xserver ({status ? status.virtualHosts.length : 0})
              </th>
            </tr>
            <tr className="bg-[#d4d0c8] text-[#000000] border-b border-[#808080]">
              <th className="p-1.5 text-left border-r border-[#808080]">Virtual Host</th>
              <th className="p-1.5 text-left border-r border-[#808080]">Description</th>
              <th className="p-1.5 text-left border-r border-[#808080]">CGI-BIN / Handlers</th>
              <th className="p-1.5 text-right border-r border-[#808080]">Hits</th>
              <th className="p-1.5 text-center">Link</th>
            </tr>
          </thead>
          <tbody>
            {(status?.virtualHosts || []).map((vh, i) => (
              <tr key={vh.host} className={i % 2 === 0 ? 'bg-white' : 'bg-[#f4f4f4]'}>
                <td className="p-1.5 border border-[#cccccc] font-mono-retro font-bold text-[#003366]">{vh.host}</td>
                <td className="p-1.5 border border-[#cccccc]">{vh.description}</td>
                <td className="p-1.5 border border-[#cccccc] font-mono-retro text-[#333333]">
                  {vh.cgiScripts.length > 0 ? vh.cgiScripts.join(', ') : 'Static HTML'}
                </td>
                <td className="p-1.5 border border-[#cccccc] text-right font-mono-retro tabular-nums">
                  {vh.hits.toLocaleString()}
                </td>
                <td className="p-1.5 border border-[#cccccc] text-center">
                  <button
                    type="button"
                    onClick={() => onNavigate(vh.defaultUrl)}
                    className="text-[#0000cc] underline cursor-pointer font-bold"
                  >
                    Open
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Published Member Pages */}
        <table className="w-full border-collapse border border-[#808080] text-xs">
          <thead>
            <tr className="bg-[#336699] text-white">
              <th colSpan={5} className="p-1.5 text-left font-bold">
                Member HTML Pages Hosted on Xserver
              </th>
            </tr>
            <tr className="bg-[#d4d0c8] text-[#000000]">
              <th className="p-1.5 text-left border border-[#808080]">Path</th>
              <th className="p-1.5 text-left border border-[#808080]">Title</th>
              <th className="p-1.5 text-left border border-[#808080]">Author</th>
              <th className="p-1.5 text-right border border-[#808080]">Hits</th>
              <th className="p-1.5 text-center border border-[#808080]">Open</th>
            </tr>
          </thead>
          <tbody>
            {(status?.userPages || []).map((page, i) => {
              const pageUrl = `http://xserver.local/pages/${encodeURIComponent(page.slug)}`;
              return (
                <tr key={page.slug} className={i % 2 === 0 ? 'bg-white' : 'bg-[#f4f4f4]'}>
                  <td className="p-1.5 border border-[#cccccc] font-mono-retro">/pages/{page.slug}</td>
                  <td className="p-1.5 border border-[#cccccc] font-bold">{page.title}</td>
                  <td className="p-1.5 border border-[#cccccc]">{page.author}</td>
                  <td className="p-1.5 border border-[#cccccc] text-right font-mono-retro tabular-nums">{page.hits}</td>
                  <td className="p-1.5 border border-[#cccccc] text-center">
                    <button
                      type="button"
                      onClick={() => onNavigate(pageUrl)}
                      className="text-[#0000cc] underline cursor-pointer font-bold"
                    >
                      Visit
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Live HTTP Access Log */}
        <div className="border border-[#808080]">
          <div className="bg-[#336699] text-white p-1.5 flex items-center justify-between gap-2 text-xs">
            <span className="font-bold">Xserver HTTP/1.0 Access Log</span>
            <input
              type="text"
              value={logFilter}
              onChange={(e) => setLogFilter(e.target.value)}
              placeholder="Filter host/path..."
              aria-label="Filter HTTP access log"
              className="px-1.5 py-0.5 text-xs bg-white text-black bevel-in-sm w-48 focus:outline-none"
            />
          </div>
          <div className="max-h-64 overflow-y-auto bg-white">
            <table className="w-full border-collapse text-xs font-mono-retro">
              <thead className="sticky top-0 bg-[#d4d0c8] text-[#000000]">
                <tr>
                  <th className="p-1.5 text-left border border-[#808080]">Time</th>
                  <th className="p-1.5 text-left border border-[#808080]">Method</th>
                  <th className="p-1.5 text-left border border-[#808080]">Host</th>
                  <th className="p-1.5 text-left border border-[#808080]">Path</th>
                  <th className="p-1.5 text-right border border-[#808080]">Status</th>
                  <th className="p-1.5 text-right border border-[#808080]">Bytes</th>
                  <th className="p-1.5 text-right border border-[#808080]">ms</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-4 text-center text-[#555555] font-sans">
                      No matching HTTP requests logged yet.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log, i) => (
                    <tr key={log.id} className={i % 2 === 0 ? 'bg-white' : 'bg-[#f8f8f8]'}>
                      <td className="p-1 px-1.5 border border-[#e0e0e0] tabular-nums">{log.timestamp}</td>
                      <td className="p-1 px-1.5 border border-[#e0e0e0] font-bold">{log.method}</td>
                      <td className="p-1 px-1.5 border border-[#e0e0e0] text-[#003366]">{log.host}</td>
                      <td className="p-1 px-1.5 border border-[#e0e0e0] max-w-xs truncate">{log.path}</td>
                      <td
                        className={`p-1 px-1.5 border border-[#e0e0e0] text-right tabular-nums font-bold ${
                          log.status >= 400 ? 'text-[#cc0000]' : 'text-[#006600]'
                        }`}
                      >
                        {log.status}
                      </td>
                      <td className="p-1 px-1.5 border border-[#e0e0e0] text-right tabular-nums">{log.bytes}</td>
                      <td className="p-1 px-1.5 border border-[#e0e0e0] text-right tabular-nums">{log.elapsedMs}</td>
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
