import React, { useState, useMemo, useRef } from 'react';
import axios from 'axios';
import './ProgressTab.css';

// ── Helpers ────────────────────────────────────────────────────────────────

function calcBMI(weight, height) {
  if (!weight || !height) return null;
  const h = parseFloat(height) / 100;
  const bmi = parseFloat(weight) / (h * h);
  return Math.round(bmi * 10) / 10;
}

function bmiLabel(bmi) {
  if (!bmi) return null;
  if (bmi < 18.5) return { label: 'Underweight', color: '#60a5fa' };
  if (bmi < 25)   return { label: 'Normal',      color: '#4ade80' };
  if (bmi < 30)   return { label: 'Overweight',  color: '#fb923c' };
  return              { label: 'Obese',       color: '#f87171' };
}

function fmt(val, unit = '') { return val ? `${val}${unit}` : '—'; }

// ── SVG Line Chart ──────────────────────────────────────────────────────────

function LineChart({ points, unit, color = 'var(--accent)' }) {
  if (points.length < 2) return (
    <div className="chart-empty">Add at least 2 checkpoints with this value to see a chart</div>
  );

  const W = 560, H = 100;
  const PAD = { t: 14, r: 16, b: 28, l: 44 };
  const pw = W - PAD.l - PAD.r;
  const ph = H - PAD.t - PAD.b;

  const vals = points.map(p => p.value);
  const minV = Math.min(...vals);
  const maxV = Math.max(...vals);
  const range = maxV - minV || 1;

  const coords = points.map((p, i) => ({
    x: PAD.l + (i / (points.length - 1)) * pw,
    y: PAD.t + ph - ((p.value - minV) / range) * ph,
    ...p
  }));

  const linePath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L${coords[coords.length-1].x.toFixed(1)},${(PAD.t+ph).toFixed(1)} L${PAD.l},${(PAD.t+ph).toFixed(1)} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="line-chart-svg" preserveAspectRatio="none">
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#chartGrad)" />
      <path d={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {coords.map((c, i) => (
        <g key={i}>
          <circle cx={c.x} cy={c.y} r="4" fill={color} stroke="var(--surface)" strokeWidth="2" />
          <text x={c.x} y={H - 4} textAnchor="middle" fontSize="9" fill="var(--text-3)">
            {new Date(c.date + 'T12:00:00').toLocaleDateString('en', { day: 'numeric', month: 'short' })}
          </text>
          <text x={c.x} y={c.y - 8} textAnchor="middle" fontSize="9" fontWeight="600" fill={color}>
            {c.value}{unit}
          </text>
        </g>
      ))}
      <text x={PAD.l - 4} y={PAD.t + 4}  textAnchor="end" fontSize="9" fill="var(--text-3)">{maxV}{unit}</text>
      <text x={PAD.l - 4} y={PAD.t + ph} textAnchor="end" fontSize="9" fill="var(--text-3)">{minV}{unit}</text>
    </svg>
  );
}

// ── Add/Edit Checkpoint Modal ───────────────────────────────────────────────

function CheckpointModal({ existing, onSave, onClose }) {
  const isEdit = !!existing;
  const [form, setForm] = useState({
    date:    existing?.date    || new Date().toISOString().split('T')[0],
    weight:  existing?.weight  || '',
    bodyFat: existing?.bodyFat || '',
    chest:   existing?.chest   || '',
    waist:   existing?.waist   || '',
    hips:    existing?.hips    || '',
    arms:    existing?.arms    || '',
    notes:   existing?.notes   || '',
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [preview, setPreview] = useState(existing?.photo || null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef();

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) { setPhotoFile(file); setPreview(URL.createObjectURL(file)); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isEdit && !photoFile) { alert('Please select a photo'); return; }

    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (photoFile) fd.append('photo', photoFile);

      if (isEdit) {
        await axios.put(`/api/checkpoints/${existing.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        await axios.post('/api/checkpoints', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      onSave();
    } catch (err) {
      alert('Failed to save checkpoint');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box progress-modal">
        <div className="modal-header">
          <h2>{isEdit ? 'Edit Checkpoint' : 'New Checkpoint'}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">

          {/* Photo */}
          <div
            className={`photo-drop ${preview ? 'has-preview' : ''}`}
            onDrop={handleDrop}
            onDragOver={e => e.preventDefault()}
            onClick={() => fileRef.current.click()}
          >
            {preview
              ? <img src={preview} alt="preview" className="photo-preview-img" />
              : <div className="photo-placeholder">
                  <span className="photo-icon">📷</span>
                  <span>Drop photo here or click to upload</span>
                  <span className="photo-hint">JPG, PNG, WEBP — max 15 MB</span>
                </div>
            }
            {preview && <div className="photo-change-hint">Click to change photo</div>}
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />

          {/* Date */}
          <div className="form-group">
            <label>Date</label>
            <input type="date" value={form.date} onChange={set('date')} required />
          </div>

          {/* Stats grid */}
          <div className="stats-form-grid">
            <div className="form-group">
              <label>Weight (kg)</label>
              <input type="number" step="0.1" min="0" placeholder="82.5" value={form.weight} onChange={set('weight')} />
            </div>
            <div className="form-group">
              <label>Body fat %</label>
              <input type="number" step="0.1" min="0" max="70" placeholder="18" value={form.bodyFat} onChange={set('bodyFat')} />
            </div>
            <div className="form-group">
              <label>Chest (cm)</label>
              <input type="number" step="0.5" min="0" placeholder="100" value={form.chest} onChange={set('chest')} />
            </div>
            <div className="form-group">
              <label>Waist (cm)</label>
              <input type="number" step="0.5" min="0" placeholder="82" value={form.waist} onChange={set('waist')} />
            </div>
            <div className="form-group">
              <label>Hips (cm)</label>
              <input type="number" step="0.5" min="0" placeholder="98" value={form.hips} onChange={set('hips')} />
            </div>
            <div className="form-group">
              <label>Arms (cm)</label>
              <input type="number" step="0.5" min="0" placeholder="36" value={form.arms} onChange={set('arms')} />
            </div>
          </div>

          <div className="form-group">
            <label>Notes</label>
            <textarea rows="2" placeholder="How are you feeling? Any observations?" value={form.notes} onChange={set('notes')} />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-save" disabled={saving}>
              {saving ? 'Saving…' : (isEdit ? 'Save Changes' : 'Add Checkpoint')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Checkpoint card ─────────────────────────────────────────────────────────

function CheckpointCard({ cp, height, onEdit, onDelete, onPhotoClick }) {
  const bmi   = calcBMI(cp.weight, height);
  const label = bmiLabel(bmi);

  const stats = [
    cp.weight  && { k: 'Weight',    v: `${cp.weight} kg` },
    bmi        && { k: 'BMI',       v: bmi, extra: label },
    cp.bodyFat && { k: 'Body fat',  v: `${cp.bodyFat}%` },
    cp.chest   && { k: 'Chest',     v: `${cp.chest} cm` },
    cp.waist   && { k: 'Waist',     v: `${cp.waist} cm` },
    cp.hips    && { k: 'Hips',      v: `${cp.hips} cm` },
    cp.arms    && { k: 'Arms',      v: `${cp.arms} cm` },
  ].filter(Boolean);

  return (
    <div className="cp-card">
      <div className="cp-photo-wrap" onClick={() => onPhotoClick(cp)}>
        <img src={cp.photo} alt={cp.date} className="cp-photo" />
        <div className="cp-photo-overlay">🔍 View</div>
      </div>
      <div className="cp-body">
        <div className="cp-date">
          {new Date(cp.date + 'T12:00:00').toLocaleDateString('en', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
        {stats.length > 0 ? (
          <div className="cp-stats">
            {stats.map(s => (
              <div key={s.k} className="cp-stat">
                <span className="cp-stat-key">{s.k}</span>
                <span className="cp-stat-val">
                  {s.v}
                  {s.extra && <span className="bmi-label" style={{ color: s.extra.color }}> {s.extra.label}</span>}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="cp-no-stats">No measurements recorded</div>
        )}
        {cp.notes && <div className="cp-notes">💬 {cp.notes}</div>}
        <div className="cp-actions">
          <button className="cp-edit-btn" onClick={() => onEdit(cp)}>✏️ Edit</button>
          <button className="cp-del-btn" onClick={() => onDelete(cp.id)}>✕ Delete</button>
        </div>
      </div>
    </div>
  );
}

// ── Lightbox ────────────────────────────────────────────────────────────────

function Lightbox({ cp, onClose }) {
  if (!cp) return null;
  return (
    <div className="lightbox-overlay" onClick={onClose}>
      <img
        src={cp.photo}
        alt={cp.date}
        className="lightbox-img"
        onClick={e => e.stopPropagation()}
      />
      <button className="lightbox-close" onClick={onClose}>✕</button>
      <div className="lightbox-date">
        {new Date(cp.date + 'T12:00:00').toLocaleDateString('en', { day: 'numeric', month: 'long', year: 'numeric' })}
      </div>
    </div>
  );
}

// ── Compare view ─────────────────────────────────────────────────────────────

function CompareView({ checkpoints, height }) {
  const sorted = [...checkpoints].sort((a, b) => a.date.localeCompare(b.date));
  const [leftId, setLeftId]   = useState(sorted[0]?.id || '');
  const [rightId, setRightId] = useState(sorted[sorted.length - 1]?.id || '');

  const left  = checkpoints.find(c => c.id === leftId);
  const right = checkpoints.find(c => c.id === rightId);

  const STAT_KEYS = ['weight', 'bodyFat', 'chest', 'waist', 'hips', 'arms'];
  const STAT_LABELS = { weight: 'Weight (kg)', bodyFat: 'Body fat %', chest: 'Chest (cm)', waist: 'Waist (cm)', hips: 'Hips (cm)', arms: 'Arms (cm)' };

  function diff(key, a, b) {
    if (!a || !b) return null;
    const av = parseFloat(a[key]), bv = parseFloat(b[key]);
    if (isNaN(av) || isNaN(bv)) return null;
    const d = bv - av;
    const sign = d > 0 ? '+' : '';
    const cls = key === 'weight' || key === 'bodyFat' || key === 'waist'
      ? (d < 0 ? 'diff-good' : d > 0 ? 'diff-bad' : 'diff-zero')
      : (d > 0 ? 'diff-good' : d < 0 ? 'diff-bad' : 'diff-zero');
    return <span className={`diff-badge ${cls}`}>{sign}{d.toFixed(1)}</span>;
  }

  const dateOpts = { day: 'numeric', month: 'short', year: 'numeric' };

  return (
    <div className="compare-view">
      <div className="compare-selectors">
        <div className="compare-selector">
          <label>Before</label>
          <select value={leftId} onChange={e => setLeftId(e.target.value)}>
            {sorted.map(c => <option key={c.id} value={c.id}>{new Date(c.date + 'T12:00:00').toLocaleDateString('en', dateOpts)}</option>)}
          </select>
        </div>
        <div className="compare-vs">VS</div>
        <div className="compare-selector">
          <label>After</label>
          <select value={rightId} onChange={e => setRightId(e.target.value)}>
            {sorted.map(c => <option key={c.id} value={c.id}>{new Date(c.date + 'T12:00:00').toLocaleDateString('en', dateOpts)}</option>)}
          </select>
        </div>
      </div>

      <div className="compare-photos">
        {left  && <div className="compare-photo-block"><img src={left.photo}  alt="before" /><span>{new Date(left.date  + 'T12:00:00').toLocaleDateString('en', dateOpts)}</span></div>}
        {right && <div className="compare-photo-block"><img src={right.photo} alt="after"  /><span>{new Date(right.date + 'T12:00:00').toLocaleDateString('en', dateOpts)}</span></div>}
      </div>

      {(left || right) && (
        <div className="compare-stats-table">
          <div className="cst-head">
            <span>Metric</span>
            <span>{left  ? new Date(left.date  + 'T12:00:00').toLocaleDateString('en', { month: 'short', day: 'numeric' }) : '—'}</span>
            <span>{right ? new Date(right.date + 'T12:00:00').toLocaleDateString('en', { month: 'short', day: 'numeric' }) : '—'}</span>
            <span>Change</span>
          </div>
          {STAT_KEYS.filter(k => (left?.[k] || right?.[k])).map(k => (
            <div key={k} className="cst-row">
              <span className="cst-label">{STAT_LABELS[k]}</span>
              <span>{left?.[k]  ? left[k]  : '—'}</span>
              <span>{right?.[k] ? right[k] : '—'}</span>
              <span>{diff(k, left, right) || '—'}</span>
            </div>
          ))}
          {(() => {
            const lBMI = calcBMI(left?.weight, height);
            const rBMI = calcBMI(right?.weight, height);
            if (!lBMI && !rBMI) return null;
            const d = lBMI && rBMI ? rBMI - lBMI : null;
            return (
              <div className="cst-row">
                <span className="cst-label">BMI</span>
                <span>{lBMI ?? '—'}</span>
                <span>{rBMI ?? '—'}</span>
                <span>{d != null ? <span className={`diff-badge ${d < 0 ? 'diff-good' : d > 0 ? 'diff-bad' : 'diff-zero'}`}>{d > 0 ? '+' : ''}{d.toFixed(1)}</span> : '—'}</span>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}

// ── Main tab ─────────────────────────────────────────────────────────────────

export default function ProgressTab({ checkpoints, profile, onRefresh, onProfileSave }) {
  const [view, setView] = useState('timeline');
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(null);
  const [lightbox, setLightbox] = useState(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [heightInput, setHeightInput] = useState(profile?.height || '');

  const sorted = useMemo(() =>
    [...checkpoints].sort((a, b) => b.date.localeCompare(a.date)),
    [checkpoints]
  );

  const latest  = sorted[0];
  const prev    = sorted[1];
  const latestWeight = latest?.weight ? parseFloat(latest.weight) : null;
  const prevWeight   = prev?.weight   ? parseFloat(prev.weight)   : null;
  const weightDelta  = latestWeight != null && prevWeight != null ? (latestWeight - prevWeight).toFixed(1) : null;
  const latestBMI    = calcBMI(latest?.weight, profile?.height);
  const latestBMILabel = bmiLabel(latestBMI);

  const chartPoints = (key) =>
    sorted.slice().reverse()
      .filter(c => c[key])
      .map(c => ({ date: c.date, value: parseFloat(c[key]) }));

  async function handleDelete(id) {
    if (!window.confirm('Delete this checkpoint?')) return;
    await axios.delete(`/api/checkpoints/${id}`);
    onRefresh();
  }

  async function saveProfile() {
    await onProfileSave({ height: heightInput });
    setEditingProfile(false);
  }

  return (
    <div className="progress-page">

      {/* ── Header row ── */}
      <div className="progress-header">
        <div className="progress-title-row">
          <h1 className="progress-title">Progress</h1>
          <button className="add-checkpoint-btn" onClick={() => setAdding(true)}>+ Add Checkpoint</button>
        </div>

        {/* Summary stats */}
        {checkpoints.length > 0 && (
          <div className="progress-summary">
            <div className="ps-tile">
              <div className="ps-num">{checkpoints.length}</div>
              <div className="ps-lbl">Checkpoints</div>
            </div>
            {latestWeight != null && (
              <div className="ps-tile">
                <div className="ps-num">{latestWeight} kg</div>
                <div className="ps-lbl">Current weight
                  {weightDelta != null && (
                    <span className={`ps-delta ${parseFloat(weightDelta) < 0 ? 'ps-down' : parseFloat(weightDelta) > 0 ? 'ps-up' : ''}`}>
                      {parseFloat(weightDelta) > 0 ? '▲' : parseFloat(weightDelta) < 0 ? '▼' : '●'} {Math.abs(weightDelta)} kg
                    </span>
                  )}
                </div>
              </div>
            )}
            {latestBMI && (
              <div className="ps-tile">
                <div className="ps-num" style={{ color: latestBMILabel?.color }}>{latestBMI}</div>
                <div className="ps-lbl">BMI — {latestBMILabel?.label}</div>
              </div>
            )}
            <div className="ps-tile ps-profile" onClick={() => setEditingProfile(v => !v)}>
              <div className="ps-num">{profile?.height ? `${profile.height} cm` : '—'}</div>
              <div className="ps-lbl">Height {profile?.height ? '✏️' : '(set for BMI)'}</div>
            </div>
          </div>
        )}

        {/* Inline height editor */}
        {editingProfile && (
          <div className="profile-editor">
            <label>Your height (cm)</label>
            <input type="number" min="100" max="250" step="1" placeholder="175"
              value={heightInput} onChange={e => setHeightInput(e.target.value)} />
            <button className="btn-save" onClick={saveProfile}>Save</button>
            <button className="btn-cancel" onClick={() => setEditingProfile(false)}>Cancel</button>
          </div>
        )}
      </div>

      {checkpoints.length === 0 ? (
        <div className="progress-empty">
          <div className="progress-empty-icon">📸</div>
          <h2>No checkpoints yet</h2>
          <p>Add your first checkpoint to start tracking your visual progress.</p>
          <button className="add-checkpoint-btn" onClick={() => setAdding(true)}>+ Add First Checkpoint</button>
        </div>
      ) : (
        <>
          {/* ── Charts ── */}
          {chartPoints('weight').length >= 2 && (
            <div className="chart-card">
              <div className="chart-label">Weight over time</div>
              <LineChart points={chartPoints('weight')} unit=" kg" />
            </div>
          )}

          {chartPoints('bodyFat').length >= 2 && (
            <div className="chart-card">
              <div className="chart-label">Body fat % over time</div>
              <LineChart points={chartPoints('bodyFat')} unit="%" color="var(--orange)" />
            </div>
          )}

          {/* ── View toggle ── */}
          <div className="view-toggle">
            <button className={view === 'timeline' ? 'active' : ''} onClick={() => setView('timeline')}>📅 Timeline</button>
            <button className={view === 'compare'  ? 'active' : ''} onClick={() => setView('compare')}>⚖️ Compare</button>
          </div>

          {/* ── Timeline ── */}
          {view === 'timeline' && (
            <div className="cp-list">
              {sorted.map(cp => (
                <CheckpointCard
                  key={cp.id}
                  cp={cp}
                  height={profile?.height}
                  onEdit={setEditing}
                  onDelete={handleDelete}
                  onPhotoClick={setLightbox}
                />
              ))}
            </div>
          )}

          {/* ── Compare ── */}
          {view === 'compare' && (
            <CompareView checkpoints={checkpoints} height={profile?.height} />
          )}
        </>
      )}

      {/* Modals */}
      {(adding || editing) && (
        <CheckpointModal
          existing={editing}
          onSave={() => { setAdding(false); setEditing(null); onRefresh(); }}
          onClose={() => { setAdding(false); setEditing(null); }}
        />
      )}
      <Lightbox cp={lightbox} onClose={() => setLightbox(null)} />
    </div>
  );
}
