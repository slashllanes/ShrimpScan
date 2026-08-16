/**
 * LiveFeed.jsx  –  Isolated MJPEG stream renderer
 *
 * WHY THIS IS A SEPARATE COMPONENT
 * ─────────────────────────────────
 * The parent App re-renders every second (session timer) and every time
 * detection stats arrive.  If the <img src={streamUrl}> lived inside App,
 * every re-render would diff the element and the browser might re-fetch the
 * stream URL, causing visible stuttering or a full reconnect.
 *
 * By isolating the stream in its own component we guarantee:
 *   • The <img> element identity is stable across App re-renders.
 *   • React.memo prevents re-rendering unless the stream URL actually changes.
 *   • Auto-reconnect logic lives here, not polluting the parent.
 *   • The snapshot imperative handle gives the parent read access to the
 *     current frame without causing a re-render.
 *
 * NETWORK RESILIENCE
 * ──────────────────
 * The Pi is under heavy CPU load.  Frame drops and brief HTTP errors are
 * expected.  The component:
 *   1. Shows a "Connecting…" spinner on initial load.
 *   2. On error, waits RETRY_DELAY_MS then forces a fresh URL (cache-bust)
 *      so the browser opens a new TCP connection to the Pi.
 *   3. Caps retries at MAX_RETRIES before showing a hard-failure UI.
 *   4. Resets the retry counter when the stream recovers (onLoad fires).
 */
import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
  memo,
} from 'react';
import { WifiOff } from 'lucide-react';

const RETRY_DELAY_MS = 2500;  // Wait before each reconnect attempt
const MAX_RETRIES    = 8;     // After this many consecutive failures → hard error

// ─── Snapshot helper ────────────────────────────────────────────
// Exposed via ref so the parent can trigger a download without
// needing any shared state that would cause re-renders.
export function captureStreamSnapshot(imgElement) {
  if (!imgElement) return;
  const canvas = document.createElement('canvas');
  canvas.width  = imgElement.naturalWidth  || 1280;
  canvas.height = imgElement.naturalHeight || 720;
  canvas.getContext('2d').drawImage(imgElement, 0, 0);
  const link = document.createElement('a');
  link.download = `shrimpscan_${Date.now()}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

// ─── LiveFeed component ─────────────────────────────────────────
const LiveFeed = forwardRef(function LiveFeed(
  { baseUrl, sessionId, showAlert, elapsed, formatElapsed },
  ref,
) {
  const imgRef      = useRef(null);
  const retryTimer  = useRef(null);
  const retryCount  = useRef(0);

  // local state — changes here do NOT affect App at all
  const [streamSrc, setStreamSrc]     = useState(null);
  const [phase, setPhase]             = useState('idle'); // idle | connecting | live | error

  // Expose snapshot method to parent via ref (no state needed)
  useImperativeHandle(ref, () => ({
    snapshot: () => captureStreamSnapshot(imgRef.current),
    getImgElement: () => imgRef.current,
  }), []);

  // Build a fresh URL (cache-busted) whenever sessionId changes
  const buildUrl = useCallback(
    () => `${baseUrl}/video_feed?s=${sessionId}&_=${Date.now()}`,
    [baseUrl, sessionId],
  );

  // Start / restart the stream
  const connect = useCallback(() => {
    if (retryTimer.current) clearTimeout(retryTimer.current);
    setPhase('connecting');
    setStreamSrc(buildUrl());
  }, [buildUrl]);

  // Kick off on mount / when sessionId changes
  useEffect(() => {
    if (!sessionId) {
      setPhase('idle');
      setStreamSrc(null);
      retryCount.current = 0;
      return;
    }
    retryCount.current = 0;
    connect();
    return () => {
      if (retryTimer.current) clearTimeout(retryTimer.current);
    };
  }, [sessionId, connect]);

  // ── Stream event handlers ──────────────────────────────────────
  const handleLoad = useCallback(() => {
    // A successful load / first good frame → stream is live
    retryCount.current = 0;
    setPhase('live');
  }, []);

  const handleError = useCallback(() => {
    if (!sessionId) return; // stopped intentionally

    retryCount.current += 1;
    if (retryCount.current >= MAX_RETRIES) {
      setPhase('error');
      return;
    }

    // Brief pause then reconnect with a fresh URL so the browser
    // doesn't serve a cached failure response
    setPhase('connecting');
    retryTimer.current = setTimeout(() => {
      setStreamSrc(buildUrl());
    }, RETRY_DELAY_MS);
  }, [sessionId, buildUrl]);

  // ── Render ─────────────────────────────────────────────────────
  return (
    <div className="video-area" style={{ position: 'relative' }}>

      {/* ── Idle (stream not started) ── */}
      {phase === 'idle' && (
        <div className="video-placeholder">
          <svg width="52" height="52" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.18, color: '#e8edf5' }}>
            <path d="M15 10l4.553-2.069A1 1 0 0121 8.845v6.31a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
          </svg>
          <p className="video-placeholder-text">Camera Feed Inactive</p>
        </div>
      )}

      {/* ── Hard error (exceeded MAX_RETRIES) ── */}
      {phase === 'error' && (
        <div className="stream-error">
          <WifiOff size={32} style={{ opacity: 0.5, marginBottom: 12, color: '#ff4d6a' }} />
          <div className="stream-error-text">
            ⚠ Could not reach the Raspberry Pi stream.<br /><br />
            Make sure Flask is running on port 5000 and the device is reachable.
          </div>
          <button
            onClick={() => { retryCount.current = 0; connect(); }}
            style={{
              marginTop: 14, padding: '7px 18px',
              background: 'rgba(0,212,170,0.12)', border: '1px solid rgba(0,212,170,0.3)',
              borderRadius: 6, color: '#00d4aa', cursor: 'pointer', fontSize: 12,
              fontFamily: "'IBM Plex Mono', monospace",
            }}
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* ── The actual MJPEG <img> ────────────────────────────────
          This element stays mounted for the entire session so the
          browser keeps the HTTP/multipart connection open.
          display:none when not yet live so we don't show a broken
          frame — but the element is still in the DOM and loading. */}
      {streamSrc && (
        <img
          ref={imgRef}
          src={streamSrc}
          alt="Live MJPEG stream from Raspberry Pi"
          onLoad={handleLoad}
          onError={handleError}
          className="video-stream"
          style={{
            display: (phase === 'live' || phase === 'connecting') ? 'block' : 'none',
            opacity: phase === 'connecting' ? 0.4 : 1,
            transition: 'opacity 0.3s ease',
          }}
        />
      )}

      {/* ── Connecting spinner overlay ── */}
      {phase === 'connecting' && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex',
          flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(8,13,26,0.6)', pointerEvents: 'none',
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            border: '3px solid rgba(0,212,170,0.15)',
            borderTopColor: '#00d4aa',
            animation: 'spin 0.8s linear infinite',
          }} />
          <span style={{
            marginTop: 12, fontSize: 11, color: '#7a8699',
            fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.5px',
          }}>
            {retryCount.current > 0
              ? `Reconnecting… (attempt ${retryCount.current}/${MAX_RETRIES})`
              : 'Connecting to Raspberry Pi…'}
          </span>
        </div>
      )}

      {/* ── Scan-line grid overlay (cosmetic) ── */}
      {phase === 'live' && <div className="grid-overlay" />}

      {/* ── WSSV alert banner ── */}
      {phase === 'live' && showAlert && (
        <div className="alert-banner">⚠ WSSV DETECTED — IMMEDIATE ATTENTION REQUIRED</div>
      )}

      {/* ── Session timer overlay ── */}
      {(phase === 'live' || phase === 'connecting') && (
        <div className="session-timer">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          {formatElapsed(elapsed)}
        </div>
      )}

      {/* Spin keyframes — injected once, no extra CSS file needed */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
});

// memo: only re-render if props actually change.
// showAlert and elapsed update frequently but are cheap string/bool props —
// the img src never changes unless sessionId changes, which is what matters.
export default memo(LiveFeed);