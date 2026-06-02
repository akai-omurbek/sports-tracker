import React, { useState, useMemo } from 'react';
import { activityEmoji, formatDetail } from '../constants';
import { computePRMap, isPR, calcVolume, fmtVolume, exportCSV } from '../utils/analytics';
import './Activities.css';

const SORT_OPTIONS = [
  { value: 'date-desc',   label: 'Newest first' },
  { value: 'date-asc',    label: 'Oldest first' },
  { value: 'name-asc',    label: 'Name A → Z' },
  { value: 'name-desc',   label: 'Name Z → A' },
  { value: 'type-asc',    label: 'Type A → Z' },
  { value: 'volume-desc', label: 'Volume ↓' },
];

export default function Activities({ activities, onDelete, onEdit }) {
  const [search, setSearch]         = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterSource, setFilterSource] = useState('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo]     = useState('');
  const [sort, setSort]             = useState('date-desc');

  const prMap = useMemo(() => computePRMap(activities), [activities]);

  const types = useMemo(() => {
    const s = new Set(activities.map(a => a.type).filter(Boolean));
    return [...s].sort();
  }, [activities]);

  const filtered = useMemo(() => {
    let list = activities.map(a => ({ ...a, _volume: calcVolume(a) }));

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(a =>
        a.name?.toLowerCase().includes(q) ||
        a.type?.toLowerCase().includes(q) ||
        a.notes?.toLowerCase().includes(q)
      );
    }
    if (filterType)   list = list.filter(a => a.type === filterType);
    if (filterSource) list = list.filter(a => a.source === filterSource);
    if (filterFrom)   list = list.filter(a => a.date >= filterFrom);
    if (filterTo)     list = list.filter(a => a.date <= filterTo);

    const [field, dir] = sort.split('-');
    list.sort((a, b) => {
      let av, bv;
      if (field === 'volume') { av = a._volume || 0; bv = b._volume || 0; }
      else if (field === 'date') {
        av = `${a.date}T${a.time || '00:00'}`;
        bv = `${b.date}T${b.time || '00:00'}`;
      } else { av = a[field] ?? ''; bv = b[field] ?? ''; }

      if (av < bv) return dir === 'asc' ? -1 : 1;
      if (av > bv) return dir === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [activities, search, filterType, filterSource, filterFrom, filterTo, sort]);

  function clearFilters() {
    setSearch(''); setFilterType(''); setFilterSource('');
    setFilterFrom(''); setFilterTo(''); setSort('date-desc');
  }

  const hasFilters = search || filterType || filterSource || filterFrom || filterTo;

  return (
    <div className="activities-page">
      <div className="activities-toolbar">
        <div className="toolbar-left">
          <div className="search-wrap">
            <span className="search-icon">🔍</span>
            <input className="search-input" type="text" placeholder="Search activities…"
              value={search} onChange={e => setSearch(e.target.value)} />
            {search && <button className="clear-search" onClick={() => setSearch('')}>✕</button>}
          </div>
        </div>

        <div className="toolbar-right">
          <select className="filter-select" value={filterType} onChange={e => setFilterType(e.target.value)}>
            <option value="">All types</option>
            {types.map(t => <option key={t} value={t}>{t}</option>)}
          </select>

          <select className="filter-select" value={filterSource} onChange={e => setFilterSource(e.target.value)}>
            <option value="">All sources</option>
            <option value="manual">Manual</option>
            <option value="google-fit">Google Fit</option>
          </select>

          <input className="filter-date" type="date" value={filterFrom} onChange={e => setFilterFrom(e.target.value)} title="From date" />
          <span className="date-sep">→</span>
          <input className="filter-date" type="date" value={filterTo} onChange={e => setFilterTo(e.target.value)} title="To date" />

          <select className="filter-select sort-select" value={sort} onChange={e => setSort(e.target.value)}>
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          {hasFilters && <button className="clear-btn" onClick={clearFilters}>Clear</button>}

          <button className="export-btn" onClick={() => exportCSV(filtered)} title="Export visible activities to CSV">
            ⬇ Export
          </button>
        </div>
      </div>

      <div className="results-count">
        {filtered.length} {filtered.length === 1 ? 'activity' : 'activities'}
        {hasFilters && ` (filtered from ${activities.length})`}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔎</div>
          <p>No activities match your filters.</p>
          {hasFilters && <button className="clear-btn" onClick={clearFilters}>Clear filters</button>}
        </div>
      ) : (
        <div className="act-table">
          <div className="act-table-head">
            <span>Activity</span>
            <span>Type</span>
            <span>Date & Time</span>
            <span>Detail</span>
            <span>Volume</span>
            <span>Source</span>
            <span></span>
          </div>
          {filtered.map(a => {
            const vol = a._volume;
            const pr  = isPR(a, prMap);
            return (
              <div key={a.id} className={`act-table-row source-${a.source}`}>
                <span className="col-name">
                  <span className="row-emoji">{activityEmoji(a.type)}</span>
                  <span className="row-name-text">
                    {a.name}
                    {pr && <span className="pr-badge" title="Personal Record">🏆</span>}
                  </span>
                  {a.notes && <span className="row-notes" title={a.notes}>💬</span>}
                </span>
                <span className="col-type"><span className="type-chip">{a.type}</span></span>
                <span className="col-date">
                  {new Date(a.date).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' })}
                  {a.time && <span className="col-time"> · {a.time}</span>}
                </span>
                <span className="col-detail">{formatDetail(a)}</span>
                <span className="col-volume">{vol ? <span className="vol-chip">{fmtVolume(vol)}</span> : '—'}</span>
                <span className="col-source">
                  <span className={`badge ${a.source === 'google-fit' ? 'badge-blue' : 'badge-green'}`}>
                    {a.source === 'google-fit' ? 'Google Fit' : 'Manual'}
                  </span>
                </span>
                <span className="col-actions">
                  {a.source === 'manual' && (
                    <>
                      <button className="edit-btn" onClick={() => onEdit(a)} title="Edit">✏️</button>
                      <button className="del-btn" onClick={() => onDelete(a.id)} title="Delete">✕</button>
                    </>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
