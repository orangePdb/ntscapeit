export type ConnectionSpeed = '56k' | 'isdn' | 't1';

export type ViewportMode = 'html' | 'xserver-console' | 'composer';

export interface BrowserResponse {
  url: string;
  normalizedUrl: string;
  host: string;
  path: string;
  title: string;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  bytes: number;
  elapsedMs: number;
  contentType: string;
  isExternal: boolean;
  isSecure: boolean;
  mode: ViewportMode;
  html: string;
}

export interface BookmarkItem {
  id: string;
  title: string;
  url: string;
}

export interface HistoryEntry {
  url: string;
  title: string;
  visitedAt: number;
}

export interface XserverLogEntry {
  id: string;
  timestamp: string;
  method: string;
  host: string;
  path: string;
  status: number;
  bytes: number;
  elapsedMs: number;
  userAgent: string;
}

export interface VirtualHostInfo {
  host: string;
  defaultUrl: string;
  description: string;
  hits: number;
  cgiScripts: string[];
}

export interface UserPage {
  slug: string;
  title: string;
  author: string;
  html: string;
  createdAt: string;
  hits: number;
}

export interface XserverStatus {
  serverName: string;
  version: string;
  protocol: string;
  uptimeSeconds: number;
  totalRequests: number;
  totalBytesServed: number;
  virtualHosts: VirtualHostInfo[];
  userPages: UserPage[];
  recentLogs: XserverLogEntry[];
}

export interface DownloadJob {
  id: string;
  filename: string;
  url: string;
  totalKb: number;
  downloadedKb: number;
  speedKbps: number;
  done: boolean;
}
