import React, { useState } from 'react';
import api from '../api';
import ExercisePicker from './ExercisePicker';
import { nowTime, todayDate } from '../constants';
import './TemplatesTab.css';

// ── Log Workout modal ─────────────────────────────────────────────────────────

function LogWorkoutModal({ template, exercises, onLog, onClose }) {
  const [date, setDate] = useState(todayDate());
  const [time, setTime] = useState(nowTime());
  const [rows, setRows] = useState(
    template.exercises.map(e => ({ ...e }))
  );
  const [logging, setLogging] = useState(false);

  const updateRow = (i, field, value) =>
    setRows(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: value } : r));

  const addRow = () => setRows(prev => [...prev, { exerciseName: '', sets: '', reps: '', weight: '' }]);
  const removeRow = (i) => setRows(prev => prev.filter((_, idx) => idx !== i));

  const handleLog = async () => {
    const valid = rows.filter(r => r.exerciseName?.trim());
    if (!valid.length) { alert('Add at least one exercise'); return; }
    setLogging(true);
    try {
      await Promise.all(valid.map(r =>
        api.post('/api/activities', {
          type: 'Strength Training',
          name: r.exerciseName,
          date, time,
          sets: r.sets || '',
          reps: r.reps || '',
          weight: r.weight || '',
          duration: '',
          notes: '',
        })
      ));
      onLog();
    } catch (e) {
      alert('Failed to log workout');
      console.error(e);
    } finally {
      setLogging(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box tmpl-log-modal">
        <div className="modal-header">
          <h2>Log: {template.name}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-form">
          <div className="form-row">
            <div className="form-group">
              <label>Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Time</label>
              <input type="time" value={time} onChange={e => setTime(e.target.value)} />
            </div>
          </div>

          <div className="log-exercises">
            <div className="log-ex-head">
              <span>Exercise</span><span>Sets</span><span>Reps</span><span>kg</span><span></span>
            </div>
            {rows.map((row, i) => (
              <div key={i} className="log-ex-row">
                <div className="log-ex-picker">
                  <ExercisePicker
                    exercises={exercises}
                    value={row.exerciseName}
                    onChange={v => updateRow(i, 'exerciseName', v)}
                  />
                </div>
                <input type="number" className="log-num" placeholder="3" min="1"
                  value={row.sets} onChange={e => updateRow(i, 'sets', e.target.value)} />
                <input type="number" className="log-num" placeholder="10" min="1"
                  value={row.reps} onChange={e => updateRow(i, 'reps', e.target.value)} />
                <input type="number" className="log-num" placeholder="60" min="0" step="0.5"
                  value={row.weight} onChange={e => updateRow(i, 'weight', e.target.value)} />
                <button className="log-remove-btn" onClick={() => removeRow(i)}>✕</button>
              </div>
            ))}
            <button className="log-add-row-btn" onClick={addRow}>+ Add exercise</button>
          </div>

          <div className="modal-actions">
            <button className="btn-cancel" onClick={onClose}>Cancel</button>
            <button className="btn-save" onClick={handleLog} disabled={logging}>
              {logging ? 'Logging…' : `Log ${rows.filter(r => r.exerciseName).length} exercises`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Edit template modal ───────────────────────────────────────────────────────

function EditTemplateModal({ template, exercises, onSave, onClose }) {
  const isNew = !template;
  const [name, setName] = useState(template?.name || '');
  const [description, setDescription] = useState(template?.description || '');
  const [rows, setRows] = useState(
    template?.exercises?.length ? template.exercises.map(e => ({ ...e })) :
    [{ exerciseName: '', sets: '', reps: '', weight: '' }]
  );

  const updateRow = (i, field, value) =>
    setRows(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: value } : r));
  const addRow = () => setRows(prev => [...prev, { exerciseName: '', sets: '', reps: '', weight: '' }]);
  const removeRow = (i) => setRows(prev => prev.filter((_, idx) => idx !== i));

  const handleSave = () => {
    if (!name.trim()) { alert('Template name is required'); return; }
    onSave({ name, description, exercises: rows.filter(r => r.exerciseName?.trim()) });
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box tmpl-edit-modal">
        <div className="modal-header">
          <h2>{isNew ? 'New Template' : 'Edit Template'}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-form">
          <div className="form-group">
            <label>Template Name *</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="e.g., Push Day, Full Body, Leg Day" autoFocus />
          </div>
          <div className="form-group">
            <label>Description</label>
            <input type="text" value={description} onChange={e => setDescription(e.target.value)}
              placeholder="Optional notes about this routine" />
          </div>

          <div className="log-exercises">
            <div className="log-ex-head">
              <span>Exercise</span><span>Sets</span><span>Reps</span><span>kg</span><span></span>
            </div>
            {rows.map((row, i) => (
              <div key={i} className="log-ex-row">
                <div className="log-ex-picker">
                  <ExercisePicker
                    exercises={exercises}
                    value={row.exerciseName}
                    onChange={v => updateRow(i, 'exerciseName', v)}
                  />
                </div>
                <input type="number" className="log-num" placeholder="3" min="1"
                  value={row.sets} onChange={e => updateRow(i, 'sets', e.target.value)} />
                <input type="number" className="log-num" placeholder="10" min="1"
                  value={row.reps} onChange={e => updateRow(i, 'reps', e.target.value)} />
                <input type="number" className="log-num" placeholder="—" min="0" step="0.5"
                  value={row.weight} onChange={e => updateRow(i, 'weight', e.target.value)} />
                <button className="log-remove-btn" onClick={() => removeRow(i)}>✕</button>
              </div>
            ))}
            <button className="log-add-row-btn" onClick={addRow}>+ Add exercise</button>
          </div>

          <div className="modal-actions">
            <button className="btn-cancel" onClick={onClose}>Cancel</button>
            <button className="btn-save" onClick={handleSave}>
              {isNew ? 'Create Template' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Template card ─────────────────────────────────────────────────────────────

function TemplateCard({ template, onLog, onEdit, onDelete }) {
  return (
    <div className="tmpl-card">
      <div className="tmpl-card-header">
        <div>
          <div className="tmpl-name">{template.name}</div>
          {template.description && <div className="tmpl-desc">{template.description}</div>}
        </div>
        <div className="tmpl-card-actions">
          <button className="tmpl-edit-btn" onClick={() => onEdit(template)} title="Edit">✏️</button>
          <button className="tmpl-del-btn" onClick={() => onDelete(template.id)} title="Delete">✕</button>
        </div>
      </div>

      <div className="tmpl-exercises">
        {template.exercises.length === 0 ? (
          <span className="tmpl-empty-ex">No exercises defined</span>
        ) : (
          template.exercises.map((ex, i) => (
            <div key={i} className="tmpl-ex-row">
              <span className="tmpl-ex-name">{ex.exerciseName}</span>
              {(ex.sets || ex.reps) && (
                <span className="tmpl-ex-detail">
                  {ex.sets && ex.reps ? `${ex.sets}×${ex.reps}` : ex.sets ? `${ex.sets} sets` : `${ex.reps} reps`}
                  {ex.weight ? ` @ ${ex.weight}kg` : ''}
                </span>
              )}
            </div>
          ))
        )}
      </div>

      <button className="tmpl-log-btn" onClick={() => onLog(template)}>
        ▶ Log Workout
      </button>
    </div>
  );
}

// ── Main tab ──────────────────────────────────────────────────────────────────

export default function TemplatesTab({ templates, exercises, onAdd, onEdit, onDelete, onWorkoutLogged }) {
  const [logging, setLogging] = useState(null);
  const [editing, setEditing] = useState(undefined); // undefined = closed, null = new

  const handleSave = async (data) => {
    if (editing?.id) {
      await onEdit(editing.id, data);
    } else {
      await onAdd(data);
    }
    setEditing(undefined);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this template?')) return;
    await onDelete(id);
  };

  return (
    <div className="templates-page">
      <div className="tmpl-toolbar">
        <h2 className="tmpl-page-title">Workout Templates</h2>
        <button className="tmpl-new-btn" onClick={() => setEditing(null)}>+ New Template</button>
      </div>

      {templates.length === 0 ? (
        <div className="tmpl-empty">
          <div className="tmpl-empty-icon">📋</div>
          <h3>No templates yet</h3>
          <p>Create a template for your regular workouts — Push Day, Pull Day, Leg Day…</p>
          <button className="tmpl-new-btn" onClick={() => setEditing(null)}>Create First Template</button>
        </div>
      ) : (
        <div className="tmpl-grid">
          {templates.map(t => (
            <TemplateCard
              key={t.id}
              template={t}
              onLog={setLogging}
              onEdit={setEditing}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {editing !== undefined && (
        <EditTemplateModal
          template={editing}
          exercises={exercises}
          onSave={handleSave}
          onClose={() => setEditing(undefined)}
        />
      )}

      {logging && (
        <LogWorkoutModal
          template={logging}
          exercises={exercises}
          onLog={() => { setLogging(null); onWorkoutLogged(); }}
          onClose={() => setLogging(null)}
        />
      )}
    </div>
  );
}
