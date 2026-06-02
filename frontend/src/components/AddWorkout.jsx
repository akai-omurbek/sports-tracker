import React, { useState } from 'react';
import { ACTIVITY_TYPES, isStrength, nowTime, todayDate } from '../constants';
import ExercisePicker from './ExercisePicker';
import './AddWorkout.css';

function emptyForm() {
  return { type: 'Strength Training', name: '', date: todayDate(), time: nowTime(), sets: '', reps: '', weight: '', duration: '', notes: '' };
}

export default function AddWorkout({ exercises, onSubmit }) {
  const [form, setForm] = useState(emptyForm());
  const [submitted, setSubmitted] = useState(false);

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
    if (!form.name.trim()) { alert('Please select or enter an activity name'); return; }
    const strength = isStrength(form.type);
    onSubmit({
      type: form.type, name: form.name, date: form.date, time: form.time,
      sets: strength ? form.sets : '', reps: strength ? form.reps : '',
      weight: strength ? form.weight : '', duration: strength ? '' : form.duration,
      notes: form.notes,
    });
    setForm({ ...emptyForm(), type: form.type, time: nowTime() });
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 2000);
  };

  const strength = isStrength(form.type);

  return (
    <div className="add-workout">
      <h2>Add Activity</h2>
      <form onSubmit={handleSubmit}>

        <div className="form-group">
          <label>Type</label>
          <select name="type" value={form.type} onChange={handleChange}>
            {ACTIVITY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label>{strength ? 'Exercise' : 'Activity Name'} *</label>
          {strength ? (
            <ExercisePicker
              exercises={exercises}
              value={form.name}
              onChange={name => setForm(prev => ({ ...prev, name }))}
            />
          ) : (
            <input name="name" type="text" value={form.name} onChange={handleChange}
              placeholder="e.g., Morning Run" />
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Date</label>
            <input name="date" type="date" value={form.date} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Time</label>
            <input name="time" type="time" value={form.time} onChange={handleChange} />
          </div>
        </div>

        {strength ? (
          <>
            <div className="form-row">
              <div className="form-group">
                <label>Sets</label>
                <input name="sets" type="number" value={form.sets} onChange={handleChange} placeholder="3" min="1" />
              </div>
              <div className="form-group">
                <label>Reps</label>
                <input name="reps" type="number" value={form.reps} onChange={handleChange} placeholder="10" min="1" />
              </div>
            </div>
            <div className="form-group">
              <label>Weight (kg)</label>
              <input name="weight" type="number" value={form.weight} onChange={handleChange} placeholder="60" min="0" step="0.5" />
            </div>
          </>
        ) : (
          <div className="form-group">
            <label>Duration (min)</label>
            <input name="duration" type="number" value={form.duration} onChange={handleChange} placeholder="30" min="0" />
          </div>
        )}

        <div className="form-group">
          <label>Notes</label>
          <textarea name="notes" value={form.notes} onChange={handleChange} placeholder="How did it feel?" rows="2" />
        </div>

        <button type="submit" className="submit-btn">Add Activity</button>
        {submitted && <div className="success-message">✓ Activity added!</div>}
      </form>
    </div>
  );
}
