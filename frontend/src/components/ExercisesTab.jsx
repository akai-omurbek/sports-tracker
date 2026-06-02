import React, { useState, useMemo } from 'react';
import './ExercisesTab.css';

const CATEGORIES = ['Push', 'Pull', 'Legs', 'Arms', 'Core', 'Cardio', 'Other'];

function ExerciseRow({ ex, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="ex-row-wrap">
      <div className="ex-row">
        <span className="ex-name">{ex.name}</span>
        <span className="ex-cat">{ex.category}</span>
        <span className="ex-actions">
          {ex.instructions && (
            <button
              className={`ex-info-btn ${expanded ? 'active' : ''}`}
              onClick={() => setExpanded(v => !v)}
              title="Instructions"
            >ℹ️</button>
          )}
          <button className="ex-edit-btn" onClick={() => onEdit(ex)} title="Edit">✏️</button>
          <button className="ex-del-btn" onClick={() => onDelete(ex.id)} title="Delete">✕</button>
        </span>
      </div>
      {expanded && ex.instructions && (
        <div className="ex-instructions">{ex.instructions}</div>
      )}
    </div>
  );
}

function ExerciseForm({ initial, onSave, onCancel, title }) {
  const [name, setName] = useState(initial?.name || '');
  const [category, setCategory] = useState(initial?.category || 'Push');
  const [instructions, setInstructions] = useState(initial?.instructions || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ name: name.trim(), category, instructions });
  };

  return (
    <form className="ex-form" onSubmit={handleSubmit}>
      <div className="ex-form-title">{title}</div>
      <div className="ex-form-fields">
        <input
          className="ex-input"
          type="text"
          placeholder="Exercise name"
          value={name}
          onChange={e => setName(e.target.value)}
          autoFocus
          required
        />
        <select className="ex-select" value={category} onChange={e => setCategory(e.target.value)}>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <textarea
        className="ex-instructions-input"
        placeholder="Instructions (optional) — e.g. grip width, cues, technique notes"
        value={instructions}
        onChange={e => setInstructions(e.target.value)}
        rows="3"
      />
      <div className="ex-form-btns">
        <button type="submit" className="ex-save-btn">Save</button>
        <button type="button" className="ex-cancel-btn" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

export default function ExercisesTab({ exercises, onAdd, onEdit, onDelete }) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');

  const grouped = useMemo(() => {
    let list = exercises;
    if (search.trim()) list = list.filter(e => e.name.toLowerCase().includes(search.toLowerCase()));
    if (filterCat) list = list.filter(e => e.category === filterCat);

    const groups = {};
    list.forEach(e => {
      const cat = e.category || 'Other';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(e);
    });
    return groups;
  }, [exercises, search, filterCat]);

  const handleAdd = (data) => { onAdd(data); setAdding(false); };
  const handleEdit = (data) => { onEdit(editingId, data); setEditingId(null); };

  return (
    <div className="exercises-page">
      <div className="ex-toolbar">
        <div className="ex-search-wrap">
          <span className="ex-search-icon">🔍</span>
          <input
            className="ex-search"
            type="text"
            placeholder="Search exercises…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && <button className="ex-clear-search" onClick={() => setSearch('')}>✕</button>}
        </div>
        <select className="ex-cat-filter" value={filterCat} onChange={e => setFilterCat(e.target.value)}>
          <option value="">All categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <button className="ex-add-btn" onClick={() => { setAdding(true); setEditingId(null); }}>
          + Add Exercise
        </button>
      </div>

      {adding && (
        <ExerciseForm title="New Exercise" onSave={handleAdd} onCancel={() => setAdding(false)} />
      )}

      <div className="ex-count">{exercises.length} exercises total</div>

      {Object.keys(grouped).length === 0 ? (
        <div className="ex-empty">
          <div className="ex-empty-icon">💪</div>
          <p>No exercises found.</p>
        </div>
      ) : (
        Object.entries(grouped)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([cat, exList]) => (
            <div key={cat} className="ex-group">
              <div className="ex-group-header">
                <span className="ex-group-label">{cat}</span>
                <span className="ex-group-count">{exList.length}</span>
              </div>
              <div className="ex-group-list">
                {exList.map(ex =>
                  editingId === ex.id ? (
                    <div key={ex.id} className="ex-inline-edit">
                      <ExerciseForm
                        title="Edit Exercise"
                        initial={ex}
                        onSave={handleEdit}
                        onCancel={() => setEditingId(null)}
                      />
                    </div>
                  ) : (
                    <ExerciseRow
                      key={ex.id}
                      ex={ex}
                      onEdit={(e) => { setEditingId(e.id); setAdding(false); }}
                      onDelete={onDelete}
                    />
                  )
                )}
              </div>
            </div>
          ))
      )}
    </div>
  );
}
