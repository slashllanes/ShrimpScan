import React, { useState, useEffect, useCallback } from 'react';
import {
  Database,
  ChevronLeft,
  ChevronRight,
  Filter,
  ShieldCheck,
  AlertTriangle,
  X,
  Search,
  Image as ImageIcon,
} from 'lucide-react';

/* ─────────────────────────────────────────────
   DATABASE TAB  –  Paginated table of detections
───────────────────────────────────────────── */
export default function DatabaseTab() {
  const [entries, setEntries] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEntries, setTotalEntries] = useState(0);
  const [filter, setFilter] = useState('All');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modalImage, setModalImage] = useState(null);
  const limit = 15;

  // ── Fetch entries ──────────────────────────────────────────
  const fetchEntries = useCallback(async (pg, flt) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: pg, limit, filter: flt });
      const res = await fetch(`/api/db/entries?${params}&t=${Date.now()}`);
      const data = await res.json();
      setEntries(data.entries || []);
      setTotalPages(data.total_pages || 1);
      setTotalEntries(data.total || 0);
    } catch (err) {
      console.error('Failed to fetch entries:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Fetch aggregate stats ──────────────────────────────────
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`/api/db/stats?t=${Date.now()}`);
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  }, []);

  useEffect(() => {
    fetchEntries(page, filter);
  }, [page, filter, fetchEntries]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setPage(1);
  };

  const healthyPct = stats && stats.total_entries > 0
    ? ((stats.healthy_count / stats.total_entries) * 100).toFixed(1)
    : '0.0';
  const infectedPct = stats && stats.total_entries > 0
    ? ((stats.infected_count / stats.total_entries) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="db-tab">

      {/* ── Summary Cards ─────────────────────────────────── */}
      <div className="db-stats-row">
        <div className="db-stat-card">
          <div className="db-stat-icon" style={{ background: 'rgba(0,212,170,0.1)' }}>
            <Database size={18} color="#00d4aa" />
          </div>
          <div>
            <div className="db-stat-label">Total Records</div>
            <div className="db-stat-value">{stats?.total_entries ?? '—'}</div>
          </div>
        </div>
        <div className="db-stat-card">
          <div className="db-stat-icon" style={{ background: 'rgba(34,197,94,0.1)' }}>
            <ShieldCheck size={18} color="#22c55e" />
          </div>
          <div>
            <div className="db-stat-label">Healthy</div>
            <div className="db-stat-value" style={{ color: '#22c55e' }}>
              {stats?.healthy_count ?? '—'}
              <span className="db-stat-pct">{healthyPct}%</span>
            </div>
          </div>
        </div>
        <div className="db-stat-card">
          <div className="db-stat-icon" style={{ background: 'rgba(255,77,106,0.1)' }}>
            <AlertTriangle size={18} color="#ff4d6a" />
          </div>
          <div>
            <div className="db-stat-label">WSSV Infected</div>
            <div className="db-stat-value" style={{ color: '#ff4d6a' }}>
              {stats?.infected_count ?? '—'}
              <span className="db-stat-pct">{infectedPct}%</span>
            </div>
          </div>
        </div>
        <div className="db-stat-card">
          <div className="db-stat-icon" style={{ background: 'rgba(122,134,153,0.1)' }}>
            <Search size={18} color="#7a8699" />
          </div>
          <div>
            <div className="db-stat-label">Date Range</div>
            <div className="db-stat-value db-stat-date">
              {stats?.first_detection ?? '—'} → {stats?.last_detection ?? '—'}
            </div>
          </div>
        </div>
      </div>

      {/* ── Table Card ────────────────────────────────────── */}
      <div className="card db-table-card">
        <div className="card-header">
          <div className="card-title">
            <Database size={15} color="#00d4aa" />
            Detection Records
            <span className="db-count-badge">{totalEntries}</span>
          </div>
          <div className="db-filter-group">
            <Filter size={13} color="#7a8699" />
            {['All', 'Healthy', 'Infected'].map(f => (
              <button
                key={f}
                className={`db-filter-btn ${filter === f ? 'db-filter-active' : ''}`}
                onClick={() => handleFilterChange(f)}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="db-table-wrap">
          <table className="db-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Timestamp</th>
                <th>Image</th>
                <th>Classification</th>
                <th>Confidence</th>
                <th>Bounding Box</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="db-table-empty">
                    <div className="db-loader" />
                    Loading records...
                  </td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="db-table-empty">
                    No detection records found.
                  </td>
                </tr>
              ) : entries.map(entry => (
                <tr key={entry.id} className="db-table-row">
                  <td className="db-td-id">{entry.id}</td>
                  <td className="db-td-ts">{entry.timestamp}</td>
                  <td className="db-td-img">
                    {entry.image_path ? (
                      <button
                        className="db-thumb-btn"
                        onClick={() => setModalImage(entry)}
                        title="Click to enlarge"
                      >
                        <img
                          src={`/api/captures/${entry.image_path}`}
                          alt={entry.class_label}
                          className="db-thumb"
                          loading="lazy"
                        />
                      </button>
                    ) : (
                      <div className="db-no-img">
                        <ImageIcon size={14} color="#3a4558" />
                      </div>
                    )}
                  </td>
                  <td>
                    <span className={`db-class-badge ${entry.class_label === 'Infected' ? 'db-class-infected' : 'db-class-healthy'}`}>
                      {entry.class_label === 'Infected' ? (
                        <AlertTriangle size={11} />
                      ) : (
                        <ShieldCheck size={11} />
                      )}
                      {entry.class_label}
                    </span>
                  </td>
                  <td className="db-td-conf">
                    <div className="db-conf-bar-bg">
                      <div
                        className="db-conf-bar-fill"
                        style={{
                          width: `${(entry.confidence * 100).toFixed(0)}%`,
                          background: entry.class_label === 'Infected' ? '#ff4d6a' : '#22c55e',
                        }}
                      />
                    </div>
                    <span className="db-conf-num">{(entry.confidence * 100).toFixed(1)}%</span>
                  </td>
                  <td className="db-td-bbox">
                    {entry.bbox ? `${entry.bbox.x}, ${entry.bbox.y}, ${entry.bbox.w}×${entry.bbox.h}` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="db-pagination">
          <span className="db-page-info">
            Page {page} of {totalPages} · {totalEntries} records
          </span>
          <div className="db-page-btns">
            <button
              className="db-page-btn"
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
            >
              <ChevronLeft size={14} />
              Previous
            </button>
            <button
              className="db-page-btn"
              disabled={page >= totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            >
              Next
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Image Modal ───────────────────────────────────── */}
      {modalImage && (
        <div className="db-modal-overlay" onClick={() => setModalImage(null)}>
          <div className="db-modal" onClick={e => e.stopPropagation()}>
            <button className="db-modal-close" onClick={() => setModalImage(null)}>
              <X size={18} />
            </button>
            <div className="db-modal-header">
              <span className={`db-class-badge ${modalImage.class_label === 'Infected' ? 'db-class-infected' : 'db-class-healthy'}`}>
                {modalImage.class_label === 'Infected' ? <AlertTriangle size={11} /> : <ShieldCheck size={11} />}
                {modalImage.class_label}
              </span>
              <span className="db-modal-conf">
                Confidence: {(modalImage.confidence * 100).toFixed(1)}%
              </span>
              <span className="db-modal-ts">{modalImage.timestamp}</span>
            </div>
            <img
              src={`/api/captures/${modalImage.image_path}`}
              alt={modalImage.class_label}
              className="db-modal-img"
            />
            <div className="db-modal-meta">
              <span>ID: {modalImage.id}</span>
              <span>Session: {modalImage.session_id}</span>
              <span>BBox: {modalImage.bbox?.x}, {modalImage.bbox?.y}, {modalImage.bbox?.w}×{modalImage.bbox?.h}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
