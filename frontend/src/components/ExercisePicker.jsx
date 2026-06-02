import React, { useState, useRef, useEffect } from 'react';
import './ExercisePicker.css';

function fuzzyScore(query, target) {
  const q = query.toLowerCase();
  const t = target.toLowerCase();
  if (t.includes(q)) return 2; // exact substring = highest priority
  let qi = 0;
  for (let i = 0; i < t.length && qi < q.length; i++) {
    if (t[i] === q[qi]) qi++;
  }
  return qi === q.length ? 1 : 0; // fuzzy match = lower priority, no match = 0
}

export default function ExercisePicker({ exercises, value, onChange }) {
  const [query, setQuery] = useState(value || '');
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const wrapRef = useRef(null);
  const inputRef = useRef(null);

  // Sync if parent resets value
  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  // Close on outside click
  useEffect(() => {
    function onClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const results = exercises
    .map(ex => ({ ...ex, score: fuzzyScore(query, ex.name) }))
    .filter(ex => !query.trim() || ex.score > 0)
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .slice(0, 12);

  const handleInput = (e) => {
    setQuery(e.target.value);
    setOpen(true);
    setHighlighted(0);
    onChange(''); // clear selection until user picks
  };

  const handleSelect = (name) => {
    setQuery(name);
    onChange(name);
    setOpen(false);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e) => {
    if (!open) { if (e.key === 'ArrowDown' || e.key === 'Enter') setOpen(true); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlighted(h => Math.min(h + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlighted(h => Math.max(h - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); if (results[highlighted]) handleSelect(results[highlighted].name); }
    else if (e.key === 'Escape') { setOpen(false); }
  };

  function highlight(text, query) {
    if (!query.trim()) return text;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return text;
    return <>{text.slice(0, idx)}<mark>{text.slice(idx, idx + query.length)}</mark>{text.slice(idx + query.length)}</>;
  }

  const catColors = {
    Push: 'cat-push', Pull: 'cat-pull', Legs: 'cat-legs',
    Arms: 'cat-arms', Core: 'cat-core', Cardio: 'cat-cardio', Other: 'cat-other'
  };

  return (
    <div className="exercise-picker" ref={wrapRef}>
      <input
        ref={inputRef}
        type="text"
        className={`picker-input ${value ? 'has-value' : ''}`}
        value={query}
        onChange={handleInput}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder="Search exercises…"
        autoComplete="off"
      />
      {value && (
        <button className="picker-clear" onClick={() => { setQuery(''); onChange(''); inputRef.current?.focus(); }}>✕</button>
      )}
      {open && (
        <div className="picker-dropdown">
          {results.length === 0 ? (
            <div className="picker-empty">No exercises found</div>
          ) : (
            results.map((ex, i) => (
              <div
                key={ex.id}
                className={`picker-option ${i === highlighted ? 'highlighted' : ''}`}
                onMouseDown={() => handleSelect(ex.name)}
                onMouseEnter={() => setHighlighted(i)}
              >
                <span className="picker-name">{highlight(ex.name, query)}</span>
                <span className={`picker-cat ${catColors[ex.category] || 'cat-other'}`}>{ex.category}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
