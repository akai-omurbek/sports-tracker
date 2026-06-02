import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Dashboard from './components/Dashboard';
import AddWorkout from './components/AddWorkout';
import GoogleFitSync from './components/GoogleFitSync';
import Activities from './components/Activities';
import ExercisesTab from './components/ExercisesTab';
import ProgressTab from './components/ProgressTab';
import TemplatesTab from './components/TemplatesTab';
import EditModal from './components/EditModal';
import './App.css';

const TABS = [
  { id: 'dashboard',  label: 'Dashboard',  icon: '📊' },
  { id: 'activities', label: 'Activities',  icon: '📋' },
  { id: 'exercises',  label: 'Exercises',   icon: '💪' },
  { id: 'progress',   label: 'Progress',    icon: '📸' },
  { id: 'templates',  label: 'Templates',   icon: '📋' },
];

export default function App() {
  const [tab, setTab] = useState('dashboard');
  const [activities, setActivities] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [accessToken, setAccessToken] = useState(() => localStorage.getItem('accessToken') || null);
  const [editingActivity, setEditingActivity] = useState(null);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [checkpoints, setCheckpoints] = useState([]);
  const [profile, setProfile] = useState({});
  const [templates, setTemplates] = useState([]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => {
    fetchActivities();
    fetchExercises();
    fetchCheckpoints();
    fetchProfile();
    fetchTemplates();
    checkAuthFromURL();
  }, []);

  async function fetchActivities() {
    try {
      const { data } = await axios.get('/api/activities');
      setActivities(data || []);
    } catch (e) { console.error(e); }
  }

  async function fetchExercises() {
    try {
      const { data } = await axios.get('/api/exercises');
      setExercises(data || []);
    } catch (e) { console.error(e); }
  }

  function checkAuthFromURL() {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code) {
      exchangeAuthCode(code);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }

  async function exchangeAuthCode(code) {
    try {
      const { data } = await axios.post('/api/auth/exchange-code', { code });
      setAccessToken(data.access_token);
      localStorage.setItem('accessToken', data.access_token);
      if (data.refresh_token) localStorage.setItem('refreshToken', data.refresh_token);
    } catch (e) { console.error(e); }
  }

  async function handleAddWorkout(workout) {
    try {
      const { data } = await axios.post('/api/activities', workout);
      setActivities(prev => [...prev, data]);
    } catch (e) { console.error(e); }
  }

  async function handleDeleteActivity(id) {
    try {
      await axios.delete(`/api/activities/${id}`);
      setActivities(prev => prev.filter(a => a.id !== id));
    } catch (e) { console.error(e); }
  }

  async function handleSaveEdit(updated) {
    try {
      const { data } = await axios.put(`/api/activities/${updated.id}`, updated);
      setActivities(prev => prev.map(a => a.id === data.id ? data : a));
      setEditingActivity(null);
    } catch (e) { console.error(e); }
  }

  async function handleAddExercise(exData) {
    try {
      const { data } = await axios.post('/api/exercises', exData);
      setExercises(prev => [...prev, data]);
    } catch (e) { console.error(e); }
  }

  async function handleEditExercise(id, exData) {
    try {
      const { data } = await axios.put(`/api/exercises/${id}`, exData);
      setExercises(prev => prev.map(e => e.id === id ? data : e));
    } catch (e) { console.error(e); }
  }

  async function fetchCheckpoints() {
    try { const { data } = await axios.get('/api/checkpoints'); setCheckpoints(data || []); }
    catch (e) { console.error(e); }
  }

  async function fetchProfile() {
    try { const { data } = await axios.get('/api/profile'); setProfile(data || {}); }
    catch (e) { console.error(e); }
  }

  async function fetchTemplates() {
    try { const { data } = await axios.get('/api/templates'); setTemplates(data || []); }
    catch (e) { console.error(e); }
  }

  async function handleAddTemplate(t) {
    try { const { data } = await axios.post('/api/templates', t); setTemplates(prev => [...prev, data]); }
    catch (e) { console.error(e); }
  }

  async function handleEditTemplate(id, t) {
    try { const { data } = await axios.put(`/api/templates/${id}`, t); setTemplates(prev => prev.map(x => x.id === id ? data : x)); }
    catch (e) { console.error(e); }
  }

  async function handleDeleteTemplate(id) {
    try { await axios.delete(`/api/templates/${id}`); setTemplates(prev => prev.filter(x => x.id !== id)); }
    catch (e) { console.error(e); }
  }

  async function handleProfileSave(updates) {
    try { const { data } = await axios.put('/api/profile', updates); setProfile(data); }
    catch (e) { console.error(e); }
  }

  async function handleDeleteExercise(id) {
    try {
      await axios.delete(`/api/exercises/${id}`);
      setExercises(prev => prev.filter(e => e.id !== id));
    } catch (e) { console.error(e); }
  }

  return (
    <div className="app">
      {/* Desktop / tablet header */}
      <header className="app-header">
        <div className="header-inner">
          <div className="logo">
            <span className="logo-icon">⚡</span>
            <span className="logo-text">Sports Tracker</span>
          </div>
          <div className="header-right">
            <nav className="tab-nav">
              {TABS.map(t => (
                <button key={t.id} className={`tab-btn ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
                  <span className="tab-icon">{t.icon}</span>
                  <span className="tab-label">{t.label}</span>
                </button>
              ))}
            </nav>
            <button className="theme-toggle" onClick={() => setDarkMode(d => !d)}
              title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}>
              {darkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile header strip */}
      <div className="mobile-header">
        <span className="logo-icon">⚡</span>
        <span className="logo-text">Sports Tracker</span>
      </div>

      <main className="app-main">
        {tab === 'dashboard' && (
          <div className="dashboard-layout">
            <div className="sidebar">
              <GoogleFitSync
                accessToken={accessToken}
                setAccessToken={setAccessToken}
                activities={activities}
                setActivities={setActivities}
              />
              <AddWorkout exercises={exercises} onSubmit={handleAddWorkout} />
            </div>
            <div className="main-content">
              <Dashboard activities={activities} onDelete={handleDeleteActivity} onEdit={setEditingActivity} />
            </div>
          </div>
        )}

        {tab === 'activities' && (
          <Activities activities={activities} onDelete={handleDeleteActivity} onEdit={setEditingActivity} />
        )}

        {tab === 'progress' && (
          <ProgressTab
            checkpoints={checkpoints}
            profile={profile}
            onRefresh={fetchCheckpoints}
            onProfileSave={handleProfileSave}
          />
        )}

        {tab === 'templates' && (
          <TemplatesTab
            templates={templates}
            exercises={exercises}
            onAdd={handleAddTemplate}
            onEdit={handleEditTemplate}
            onDelete={handleDeleteTemplate}
            onWorkoutLogged={fetchActivities}
          />
        )}

        {tab === 'exercises' && (
          <ExercisesTab
            exercises={exercises}
            onAdd={handleAddExercise}
            onEdit={handleEditExercise}
            onDelete={handleDeleteExercise}
          />
        )}
      </main>

      <EditModal
        activity={editingActivity}
        exercises={exercises}
        onSave={handleSaveEdit}
        onClose={() => setEditingActivity(null)}
      />

      {/* Mobile bottom navigation */}
      <nav className="bottom-nav">
        {TABS.map(t => (
          <button key={t.id} className={`bottom-nav-btn ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
            <span className="bnav-icon">{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
        <button className="bottom-nav-theme" onClick={() => setDarkMode(d => !d)}>
          {darkMode ? '☀️' : '🌙'}
        </button>
      </nav>
    </div>
  );
}
