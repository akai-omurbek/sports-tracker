import React, { useState, useEffect } from 'react';
import { ACTIVITY_TYPES, isStrength } from '../constants';
import ExercisePicker from './ExercisePicker';
import './EditModal.css';

export default function EditModal({ activity, exercises, onSave, onClose }) {
  const [form, setForm] = useState({});

  useEffect(() => {
    if (activity) setForm({ ...activity });
  }, [activity]);

  if (!activity) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => {
      const next = { ...prev, [name]: value };
      if (name === 'type') next.name = '';
      return next;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name?.trim()) { alert('Activity name is required'); return; }
    const strength = isStrength(form.type);
    onSave({
      ...form,
      sets:     strength ? form.sets     : '',
      reps:     strength ? form.reps     : '',
      weight:   strength ? form.weight   : '',
      duration: strength ? ''            : form.duration,
    });
  };

  const strength = isStrength(form.type);

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <h2>Edit Activity</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Type</label>
            <select name="type" value={form.type || ''} onChange={handleChange}>
              {ACTIVITY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label>{strength ? 'Exercise' : 'Activity Name'} *</label>
            {strength ? (
              <ExercisePicker
                exercises={exercises || []}
                value={form.name || ''}
                onChange={name => setForm(prev => ({ ...prev, name }))}
              />
            ) : (
              <input name="name" type="text" value={form.name || ''} onChange={handleChange} required />
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Date</label>
              <input name="date" type="date" value={form.date || ''} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Time</label>
              <input name="time" type="time" value={form.time || ''} onChange={handleChange} />
            </div>
          </div>

          {strength ? (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label>Sets</label>
                  <input name="sets" type="number" value={form.sets || ''} onChange={handleChange} placeholder="3" min="1" />
                </div>
                <div className="form-group">
                  <label>Reps</label>
                  <input name="reps" type="number" value={form.reps || ''} onChange={handleChange} placeholder="10" min="1" />
                </div>
              </div>
              <div className="form-group">
                <label>Weight (kg)</label>
                <input name="weight" type="number" value={form.weight || ''} onChange={handleChange} placeholder="60" min="0" step="0.5" />
              </div>
            </>
          ) : (
            <div className="form-group">
              <label>Duration (min)</label>
              <input name="duration" type="number" value={form.duration || ''} onChange={handleChange} placeholder="30" min="0" />
            </div>
          )}

          <div className="form-group">
            <label>Notes</label>
            <textarea name="notes" value={form.notes || ''} onChange={handleChange} rows="2" placeholder="Any notes?" />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-save">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
}
