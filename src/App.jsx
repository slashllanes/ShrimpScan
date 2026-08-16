import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Activity,
  AlertTriangle,
  ShieldCheck,
  Settings,
  Download,
  Video,
  VideoOff,
  ShieldAlert,
  WifiOff,
  Camera,
  Clock,
  Database,
  LayoutDashboard,
} from 'lucide-react';
import DatabaseTab from './DatabaseTab';
import './App.css';

/* ─────────────────────────────────────────────
   CUSTOM LOGO  –  Shrimp + Camera lens SVG
───────────────────────────────────────────── */
function ShrimpScanLogo() {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 26, height: 26 }}>
      {/* Shrimp body */}
      <path d="M20 8 C28 8 32 14 30 22 C28 28 22 33 18 34 C14 33 10 28 10 22 C10 15 14 8 20 8Z"
        fill="rgba(0,212,170,0.25)" stroke="#00d4aa" strokeWidth="1.2" />
      {/* Segments */}
      <path d="M13 20 Q20 22 27 20" stroke="#00d4aa" strokeWidth="1" fill="none" opacity="0.6" />
      <path d="M12 24 Q20 26 28 24" stroke="#00d4aa" strokeWidth="1" fill="none" opacity="0.5" />
      {/* Tail */}
      <path d="M18 34 L14 38 M18 34 L20 38 M18 34 L22 38" stroke="#00d4aa" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
      {/* Antennae */}
      <path d="M16 9 L8 4 M20 8 L14 3" stroke="#00d4aa" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
      {/* Camera lens */}
      <circle cx="30" cy="11" r="7" fill="#0a0f1a" stroke="#00d4aa" strokeWidth="1.2" />
      <circle cx="30" cy="11" r="4" fill="rgba(0,212,170,0.15)" stroke="#00d4aa" strokeWidth="0.8" />
      <circle cx="30" cy="11" r="2" fill="rgba(0,212,170,0.4)" />
      <circle cx="31.5" cy="9.5" r="0.8" fill="white" opacity="0.6" />
    </svg>
  );
}

/* ─────────────────────────────────────────────
   PURE SVG AREA CHART  –  No external deps
───────────────────────────────────────────── */
function MiniAreaChart({ data, width = 500, height = 160 }) {
  const svgRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(width);

  // Responsive: observe parent width
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const parent = svg.parentElement;
    if (!parent) return;
    const obs = new ResizeObserver(entries => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    obs.observe(parent);
    return () => obs.disconnect();
  }, []);

  const chart = useMemo(() => {
    if (!data || data.length < 2) return null;

    const W = containerWidth;
    const H = height;
    const padTop = 20;
    const padBot = 28;
    const padLeft = 32;
    const padRight = 12;
    const plotW = W - padLeft - padRight;
    const plotH = H - padTop - padBot;

    const maxVal = Math.max(1, ...data.map(d => Math.max(d.Healthy, d.Infected)));
    const yTicks = [];
    const tickCount = 4;
    for (let i = 0; i <= tickCount; i++) {
      yTicks.push(Math.round((maxVal / tickCount) * i));
    }

    const xStep = plotW / (data.length - 1);
    const toX = (i) => padLeft + i * xStep;
    const toY = (v) => padTop + plotH - (v / maxVal) * plotH;

    const buildPath = (key) =>
      data.map((d, i) => `${i === 0 ? 'M' : 'L'}${toX(i).toFixed(1)},${toY(d[key]).toFixed(1)}`).join(' ');

    const buildArea = (key) => {
      const line = buildPath(key);
      return `${line} L${toX(data.length - 1).toFixed(1)},${(padTop + plotH).toFixed(1)} L${padLeft},${(padTop + plotH).toFixed(1)} Z`;
    };

    // Show ~5 evenly spaced x-axis labels
    const labelInterval = Math.max(1, Math.floor(data.length / 5));

    return (
      <svg ref={svgRef} width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none"
        style={{ display: 'block', overflow: 'visible' }}>
        <defs>
          <linearGradient id="gH" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="gI" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ff4d6a" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#ff4d6a" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {yTicks.map((t, i) => (
          <line key={i} x1={padLeft} x2={W - padRight} y1={toY(t)} y2={toY(t)}
            stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
        ))}

        {/* Y-axis labels */}
        {yTicks.map((t, i) => (
          <text key={`yt${i}`} x={padLeft - 6} y={toY(t) + 3}
            fill="#3a4558" fontSize="9" fontFamily="'IBM Plex Mono', monospace" textAnchor="end">
            {t}
          </text>
        ))}

        {/* X-axis labels */}
        {data.map((d, i) => (
          i % labelInterval === 0 && (
            <text key={`xt${i}`} x={toX(i)} y={H - 6}
              fill="#3a4558" fontSize="8" fontFamily="'IBM Plex Mono', monospace" textAnchor="middle">
              {d.time}
            </text>
          )
        ))}

        {/* Areas */}
        <path d={buildArea('Healthy')} fill="url(#gH)" />
        <path d={buildArea('Infected')} fill="url(#gI)" />

        {/* Lines */}
        <path d={buildPath('Healthy')} fill="none" stroke="#22c55e" strokeWidth="2" strokeLinejoin="round" />
        <path d={buildPath('Infected')} fill="none" stroke="#ff4d6a" strokeWidth="2" strokeLinejoin="round" />

        {/* Endpoint dots */}
        {data.length > 0 && (
          <>
            <circle cx={toX(data.length - 1)} cy={toY(data[data.length - 1].Healthy)} r="3" fill="#22c55e" />
            <circle cx={toX(data.length - 1)} cy={toY(data[data.length - 1].Infected)} r="3" fill="#ff4d6a" />
          </>
        )}
      </svg>
    );
  }, [data, containerWidth, height]);

  if (!data || data.length < 2) {
    return (
      <div ref={svgRef} style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: '#3a4558', letterSpacing: '0.5px' }}>
          Collecting data points...
        </span>
      </div>
    );
  }

  return <div style={{ width: '100%' }}>{chart}</div>;
}

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
function formatElapsed(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

function getInfectionBarColor(rate) {
  if (rate <= 10) return '#22c55e';
  if (rate <= 30) return '#f59e0b';
  return '#ff4d6a';
}

/* ─────────────────────────────────────────────
   MAIN APP
───────────────────────────────────────────── */
export default function App() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamSessionId, setStreamSessionId] = useState(Date.now());
  const [stats, setStats] = useState({ total: 0, healthy: 0, infected: 0, avg_confidence: 0, inference_ms: 0 });
  const [logs, setLogs] = useState([]);
  const [showAlert, setShowAlert] = useState(false);
  const [streamError, setStreamError] = useState(false);
  const [chartData, setChartData] = useState([]);
  const [sessionStart, setSessionStart] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState([]);
  const [previewDate, setPreviewDate] = useState('');

  // ---------------------------------------------------------
  // SMART ORIGIN DETECTION:
  // - Dev (localhost via Vite): use relative URLs to leverage
  //   the Vite proxy configured in vite.config.js
  // - Production (served by Flask on Pi): use relative URLs
  //   since everything is same-origin.
  // ---------------------------------------------------------
  const API_BASE = '';  // Always use relative URLs for proxy/same-origin
  const streamUrl = `${API_BASE}/video_feed?t=${streamSessionId}`;
  const isRpiConnected = isStreaming && !streamError;

  // ── Session Timer ──────────────────────────────────────────
  useEffect(() => {
    if (!isStreaming) return;
    setSessionStart(Date.now());
    setElapsed(0);
    const timer = setInterval(() => {
      setElapsed(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isStreaming]);

  // ── Reset stream error on start ────────────────────────────
  useEffect(() => {
    if (isStreaming) setStreamError(false);
  }, [isStreaming]);

  // ── Poll detection results ─────────────────────────────────
  useEffect(() => {
    if (!isStreaming) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/detection_results?t=${Date.now()}`);
        const data = await res.json();

        const newStats = {
          total: data.total,
          healthy: data.Healthy,
          infected: data.Infected,
          avg_confidence: data.avg_confidence || 0,
          inference_ms: data.inference_ms || 0,
        };
        setStats(newStats);

        // Build chart data point
        setChartData(prev => {
          const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          const next = [...prev, { time, Healthy: data.Healthy, Infected: data.Infected }];
          return next.length > 30 ? next.slice(-30) : next;
        });

        // Log entries with real confidence
        const conf = data.avg_confidence || 0;
        if (data.Infected > 0) {
          setShowAlert(true);
          setLogs(prev => [{
            id: Date.now(),
            type: 'alert',
            message: `WSSV Suspected — ${data.Infected} shrimp flagged`,
            confidence: conf,
            time: new Date().toLocaleTimeString(),
          }, ...prev].slice(0, 50));
        } else if (data.Healthy > 0) {
          setShowAlert(false);
          setLogs(prev => [{
            id: Date.now(),
            type: 'info',
            message: `${data.Healthy} Healthy shrimp detected`,
            confidence: conf,
            time: new Date().toLocaleTimeString(),
          }, ...prev].slice(0, 50));
        }

      } catch (err) {
        console.error("Failed to fetch detection results:", err);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isStreaming]);

  const toggleStream = () => {
    if (!isStreaming) {
      setStreamSessionId(Date.now());
      setChartData([]);
      setLogs([]);
    }
    setIsStreaming(s => !s);
  };

  // ── Snapshot capture ───────────────────────────────────────
  const snapshotRef = useRef(null);
  const captureSnapshot = useCallback(() => {
    const img = snapshotRef.current;
    if (!img) return;
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth || 640;
    canvas.height = img.naturalHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const link = document.createElement('a');
    link.download = `shrimpscan_${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }, []);

  // ── Export logs as CSV ─────────────────────────────────────
  const exportCSV = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/logs?t=${Date.now()}`);
      const data = await res.json();
      if (!data.length) {
        setPreviewData([]);
        setPreviewDate(new Date().toLocaleDateString());
        setShowPreview(true);
        return;
      }

      setPreviewData(data);
      setPreviewDate(new Date().toLocaleDateString());
      setShowPreview(true);
    } catch (err) {
      console.error("Export failed:", err);
    }
  }, []);

  const closePreview = useCallback(() => {
    setShowPreview(false);
  }, []);

  const triggerDownload = useCallback(() => {
    if (!previewData.length) return;

    const headers = ['timestamp', 'total', 'healthy', 'infected'];
    const rows = previewData.map(d => [
      `"${d.timestamp}"`,
      d.total,
      d.healthy,
      d.infected,
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `shrimpscan_export_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    closePreview();
  }, [previewData, closePreview]);

  const triggerPrint = useCallback(() => {
    if (!previewData.length) return;

    const html = `
      <html>
        <head>
          <title>ShrimpScan Export Preview</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 24px; color: #0f172a; background: #fff; }
            h1 { margin: 0 0 12px; font-size: 22px; }
            .meta { margin-bottom: 16px; color: #475569; font-size: 13px; }
            table { width: 100%; border-collapse: collapse; margin-top: 18px; }
            th, td { border: 1px solid #e2e8f0; padding: 10px 12px; text-align: left; font-size: 13px; }
            th { background: #f8fafc; color: #475569; }
            .status-healthy { color: #0d9488; }
            .status-infected { color: #be123c; }
          </style>
        </head>
        <body>
          <h1>ShrimpScan Export Preview</h1>
          <div class="meta">Exported on ${new Date().toLocaleString()} · ${previewData.length} record${previewData.length === 1 ? '' : 's'}</div>
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Total</th>
                <th>Healthy</th>
                <th>Infected</th>
              </tr>
            </thead>
            <tbody>
              ${previewData.map(d => `
                <tr>
                  <td>${d.timestamp}</td>
                  <td>${d.total}</td>
                  <td>${d.healthy}</td>
                  <td>${d.infected}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <script>
            window.onload = function() { window.print(); window.close(); };
          <\/script>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(html);
    printWindow.document.close();
  }, [previewData]);

  const infectionRate = stats.total > 0 ? ((stats.infected / stats.total) * 100).toFixed(1) : '0.0';
  const healthyRate = stats.total > 0 ? ((stats.healthy / stats.total) * 100).toFixed(1) : '0.0';
  const infRateNum = parseFloat(infectionRate);

  return (
    <div style={{ minHeight: '100vh' }}>

      {/* ── NAVBAR ───────────────────────────────────────── */}
      <nav className="navbar">
        <div className="navbar-brand">
          <div className="navbar-logo">
            <ShrimpScanLogo />
          </div>
          <div>
            <h1 className="navbar-title">ShrimpScan</h1>
            <p className="navbar-subtitle">YOLO11 · WSSV DETECTION SYSTEM</p>
          </div>
        </div>

        <div className="navbar-actions">
          {isRpiConnected ? (
            <div className="pill pill-connected">
              <div className="dot dot-connected" />
              RPi 4 Connected
            </div>
          ) : (
            <div className="pill pill-disconnected">
              <div className="dot dot-disconnected" />
              <WifiOff size={12} style={{ marginRight: 2 }} />
              Not Connected
            </div>
          )}
          <button className="icon-btn" title="Settings">
            <Settings size={16} />
          </button>
        </div>
      </nav>

      {/* ── TAB BAR ──────────────────────────────────────── */}
      <div className="tab-bar">
        <button
          className={`tab-btn ${activeTab === 'dashboard' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <LayoutDashboard size={14} />
          Dashboard
        </button>
        <button
          className={`tab-btn ${activeTab === 'database' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('database')}
        >
          <Database size={14} />
          Database
        </button>
      </div>

      {/* ── MAIN CONTENT ─────────────────────────────────── */}
      {activeTab === 'database' ? (
        <main className="main-grid" style={{ gridTemplateColumns: '1fr' }}>
          <DatabaseTab />
        </main>
      ) : (
      <main className="main-grid">

        {/* LEFT COLUMN */}
        <div>
          {/* VIDEO CARD */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <Video size={15} color="#00d4aa" />
                Live Camera Feed
              </div>
              <span className={`badge ${isRpiConnected ? 'badge-fps' : 'badge-offline'}`}>
                {isRpiConnected ? 'LIVE FEED · RPI' : 'OFFLINE'}
              </span>
            </div>

            {/* VIDEO AREA */}
            <div className="video-area">
              {isStreaming ? (
                <>
                  <img
                    ref={snapshotRef}
                    src={streamUrl}
                    alt="Live Stream from Pi"
                    onError={() => setStreamError(true)}
                    className="video-stream"
                    style={{ display: streamError ? 'none' : 'block' }}
                  />

                  {streamError && (
                    <div className="stream-error">
                      <div className="stream-error-text">
                        ⚠ Failed to connect to Raspberry Pi stream.<br /><br />
                        Make sure the Flask server is running on shrimpscan.local:5000
                      </div>
                    </div>
                  )}

                  <div className="grid-overlay" />

                  {showAlert && (
                    <div className="alert-banner">⚠ WSSV DETECTED — IMMEDIATE ATTENTION REQUIRED</div>
                  )}

                  {/* Session Timer Overlay */}
                  <div className="session-timer">
                    <Clock size={10} />
                    {formatElapsed(elapsed)}
                  </div>
                </>
              ) : (
                <div className="video-placeholder">
                  <VideoOff size={52} style={{ opacity: 0.18, color: '#e8edf5' }} />
                  <p className="video-placeholder-text">Camera Feed Inactive</p>
                </div>
              )}
            </div>

            {/* CONTROLS */}
            <div className="controls-bar">
              <div className="controls-left">
                <button className={`btn-start ${isStreaming ? 'btn-start-on' : 'btn-start-off'}`} onClick={toggleStream}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    {isStreaming
                      ? <><circle cx="12" cy="12" r="10" /><rect x="9" y="9" width="6" height="6" /></>
                      : <><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></>
                    }
                  </svg>
                  {isStreaming ? 'Stop Detection' : 'Start Detection'}
                </button>

                {isStreaming && (
                  <button className="btn-secondary" onClick={captureSnapshot} title="Save a snapshot of the current frame">
                    <Camera size={13} />
                    Snapshot
                  </button>
                )}
              </div>

              <button className="btn-secondary" onClick={exportCSV}>
                <Download size={13} />
                Export CSV
              </button>
            </div>
          </div>

          {/* METRICS ROW */}
          <div className="metrics-row">
            {[
              {
                icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>,
                label: 'YOLO11 MODEL', val: 'Loaded',
              },
              {
                icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>,
                label: 'WEBCAM (2KHD)', val: isRpiConnected ? 'Ready' : 'Offline',
              },
              {
                icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>,
                label: 'INFERENCE',
                val: isRpiConnected ? `${stats.inference_ms}ms` : '--',
              },
              {
                icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>,
                label: 'AVG CONFIDENCE',
                val: isRpiConnected ? `${(stats.avg_confidence * 100).toFixed(0)}%` : '--',
              },
            ].map((m, i) => (
              <div key={i} className={`metric${isStreaming ? ' active' : ''}`}>
                <div className="metric-icon">{m.icon}</div>
                <div className="metric-label">{m.label}</div>
                <div className="metric-val">{m.val}</div>
              </div>
            ))}
          </div>

          {/* DETECTION TREND CHART */}
          <div className="card chart-card">
            <div className="card-header">
              <div className="card-title">
                <Activity size={15} color="#00d4aa" />
                Detection Trend
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: "'IBM Plex Mono', monospace", fontSize: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} />
                  <span style={{ color: '#7a8699' }}>Healthy</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: "'IBM Plex Mono', monospace", fontSize: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff4d6a' }} />
                  <span style={{ color: '#7a8699' }}>Infected</span>
                </div>
              </div>
            </div>
            <div className="chart-body">
              <MiniAreaChart data={chartData} height={160} />
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="right-col">

          {/* SESSION OVERVIEW */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <Activity size={15} color="#00d4aa" />
                Session Overview
              </div>
              {isStreaming && (
                <span style={{
                  fontFamily: "'IBM Plex Mono', monospace", fontSize: 10,
                  color: '#7a8699',
                }}>
                  {formatElapsed(elapsed)}
                </span>
              )}
            </div>
            <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>

              {/* Total */}
              <div className="stat-block" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}>
                <div>
                  <div className="stat-label-text">Total Scanned</div>
                  <div className="stat-num" style={{ color: '#e8edf5' }}>{stats.total}</div>
                  <div className="stat-sub">shrimp detected</div>
                </div>
                <div className="stat-icon" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7a8699" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                </div>
              </div>

              {/* Healthy */}
              <div className="stat-block" style={{ background: 'rgba(34,197,94,0.06)', borderColor: 'rgba(34,197,94,0.15)' }}>
                <div>
                  <div className="stat-label-text">Healthy · P. monodon</div>
                  <div className="stat-num" style={{ color: '#22c55e' }}>{stats.healthy}</div>
                  <div className="stat-sub">{healthyRate}% of total</div>
                </div>
                <div className="stat-icon" style={{ background: 'rgba(34,197,94,0.12)' }}>
                  <ShieldCheck size={18} color="#22c55e" />
                </div>
              </div>

              {/* WSSV */}
              <div className="stat-block" style={{ background: 'rgba(255,77,106,0.06)', borderColor: 'rgba(255,77,106,0.15)' }}>
                <div>
                  <div className="stat-label-text">WSSV Suspected</div>
                  <div className="stat-num" style={{ color: '#ff4d6a' }}>{stats.infected}</div>
                  <div className="stat-sub">{infectionRate}% infection rate</div>
                </div>
                <div className="stat-icon" style={{ background: 'rgba(255,77,106,0.12)' }}>
                  <AlertTriangle size={18} color="#ff4d6a" />
                </div>
              </div>

              {/* Infection rate bar — dynamic color */}
              <div style={{ marginTop: 4 }}>
                <div className="rate-meta">
                  <span>Infection Rate</span>
                  <span>{infectionRate}%</span>
                </div>
                <div className="rate-bar-bg">
                  <div
                    className="rate-bar-fill"
                    style={{
                      width: `${Math.min(infRateNum, 100)}%`,
                      background: getInfectionBarColor(infRateNum),
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* DETECTION LOGS */}
          <div className="card" style={{ flex: 1 }}>
            <div className="card-header">
              <div className="card-title">
                <ShieldAlert size={15} color="#7a8699" />
                Detection Logs
              </div>
              {isStreaming && <span className="badge badge-live">LIVE</span>}
            </div>
            <div className="logs-scroll" style={{ height: 300, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {logs.length === 0 ? (
                <div className="log-empty">
                  {isStreaming ? 'Waiting for detections...' : 'System offline.'}
                </div>
              ) : logs.map(log => (
                <div key={log.id} className="log-item" style={
                  log.type === 'alert'
                    ? { background: 'rgba(255,77,106,0.06)', borderColor: 'rgba(255,77,106,0.15)' }
                    : { background: 'rgba(0,212,170,0.04)', borderColor: 'rgba(0,212,170,0.1)' }
                }>
                  <div className="log-dot" style={{ background: log.type === 'alert' ? '#ff4d6a' : '#00d4aa' }} />
                  <div style={{ flex: 1 }}>
                    <div className="log-msg" style={{ color: log.type === 'alert' ? '#ff4d6a' : '#00d4aa' }}>
                      {log.message}
                    </div>
                    <div className="log-meta">
                      <span>Conf: {(log.confidence * 100).toFixed(0)}%</span>
                      <span>{log.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>
      )}

      {showPreview && (
        <div className="modal-backdrop" onClick={closePreview}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <span style={{ color: '#00d4aa', fontSize: 18 }}>📄</span>
                Export Preview
              </div>
              <button className="modal-close" onClick={closePreview}>×</button>
            </div>
            <div className="modal-body">
              <div className="preview-meta">
                <span>Total Records: <strong>{previewData.length}</strong></span>
                <span>Date: <strong>{previewDate}</strong></span>
              </div>
              <div className="table-wrapper">
                <table className="preview-table">
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>Total</th>
                      <th>Healthy</th>
                      <th>Infected</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.length === 0 ? (
                      <tr>
                        <td colSpan="4" style={{ textAlign: 'center', color: '#7a8699', padding: '20px 0' }}>
                          No records available.
                        </td>
                      </tr>
                    ) : previewData.map((row, idx) => (
                      <tr key={idx}>
                        <td>{row.timestamp}</td>
                        <td>{row.total}</td>
                        <td>{row.healthy}</td>
                        <td>{row.infected}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={closePreview}>Cancel</button>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn-secondary" onClick={triggerPrint}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 14 }}>🖨️</span> Print Report
                  </span>
                </button>
                <button className="btn-start btn-start-off" onClick={triggerDownload}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 14 }}>⬇️</span> Save CSV
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}