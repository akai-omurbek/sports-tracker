import React, { useMemo } from 'react';
import { activityEmoji, formatDetail } from '../constants';
import { computePRMap, isPR, calcVolume, fmtVolume, weeklyVolume, calcStreaks, activitiesPerDay } from '../utils/analytics';
import ContributionGraph from './ContributionGraph';
import './Dashboard.css';

const REP_TRACKERS = [
  { key: 'pushups', label: 'Push-ups', emoji: '🫸', names: ['push-ups', 'push ups', 'pushups'] },
  { key: 'pullups', label: 'Pull-ups', emoji: '🏋️', names: ['pull-ups', 'pull ups', 'pullups', 'chin-ups', 'chin ups'] },
];

function countReps(activities, names) {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  let total = 0, week = 0;
  activities.forEach(a => {
    if (!names.some(n => a.name?.toLowerCase().includes(n))) return;
    const reps = (parseInt(a.sets) || 1) * (parseInt(a.reps) || 0);
    total += reps;
    if (new Date(a.date) >= weekAgo) week += reps;
  });
  return { total, week };
}

export default function Dashboard({ activities, onDelete, onEdit }) {
  const prMap     = useMemo(() => computePRMap(activities), [activities]);
  const dayMap    = useMemo(() => activitiesPerDay(activities), [activities]);
  const streaks   = useMemo(() => calcStreaks(activities), [activities]);
  const wVolume   = useMemo(() => weeklyVolume(activities), [activities]);

  const { stats } = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weekActivities = activities.filter(a => new Date(a.date) >= weekAgo && new Date(a.date) <= now);

    const byType = {};
    let totalDuration = 0;
    const days = Array(7).fill(0);

    weekActivities.forEach(a => {
      byType[a.type] = (byType[a.type] || 0) + 1;
      if (a.duration) totalDuration += parseInt(a.duration) || 0;
      const dayIndex = Math.floor((now - new Date(a.date)) / (24 * 60 * 60 * 1000));
      if (dayIndex >= 0 && dayIndex < 7) days[6 - dayIndex]++;
    });

    return { stats: { total: weekActivities.length, byType, totalDuration, days } };
  }, [activities]);

  const recent = [...activities]
    .sort((a, b) => {
      const da = `${a.date}T${a.time || '00:00'}`;
      const db = `${b.date}T${b.time || '00:00'}`;
      return db.localeCompare(da);
    })
    .slice(0, 20);

  const topPRs = useMemo(() => {
    return [...prMap.entries()]
      .sort((a, b) => {
        const da = activities.find(x => x.id === a[1].activityId)?.date || '';
        const db = activities.find(x => x.id === b[1].activityId)?.date || '';
        return db.localeCompare(da);
      })
      .slice(0, 6);
  }, [prMap, activities]);

  const dayLabels = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toLocaleDateString('en', { weekday: 'short' });
  });

  const maxDay = Math.max(...stats.days, 1);

  return (
    <div className="dashboard">
      {/* ── Streak row ── */}
      <div className="streak-row">
        <div className="streak-tile">
          <span className="streak-fire">🔥</span>
          <div className="streak-info">
            <div className="streak-num">{streaks.current}</div>
            <div className="streak-lbl">day streak</div>
          </div>
        </div>
        <div className="streak-tile">
          <span className="streak-fire">🏆</span>
          <div className="streak-info">
            <div className="streak-num">{streaks.longest}</div>
            <div className="streak-lbl">longest streak</div>
          </div>
        </div>
        {wVolume > 0 && (
          <div className="streak-tile">
            <span className="streak-fire">⚡</span>
            <div className="streak-info">
              <div className="streak-num">{fmtVolume(wVolume)}</div>
              <div className="streak-lbl">volume this week</div>
            </div>
          </div>
        )}
      </div>

      {/* ── Week summary ── */}
      <div className="week-header"><h2>This Week</h2></div>

      <div className="stat-row">
        <div className="stat-tile">
          <div className="stat-num">{stats.total}</div>
          <div className="stat-lbl">Activities</div>
        </div>
        <div className="stat-tile">
          <div className="stat-num">{stats.totalDuration ? `${Math.round(stats.totalDuration / 60 * 10) / 10}h` : '—'}</div>
          <div className="stat-lbl">Time logged</div>
        </div>
        <div className="stat-tile">
          <div className="stat-num">{Object.keys(stats.byType).length}</div>
          <div className="stat-lbl">Types</div>
        </div>
      </div>

      {/* ── Bar chart ── */}
      <div className="bar-chart">
        {stats.days.map((count, i) => (
          <div key={i} className="bar-col">
            <div className="bar-wrap">
              <div className="bar-fill" style={{ height: `${(count / maxDay) * 100}%` }} title={`${count} activit${count === 1 ? 'y' : 'ies'}`} />
            </div>
            <div className="bar-label">{dayLabels[i]}</div>
          </div>
        ))}
      </div>

      {Object.keys(stats.byType).length > 0 && (
        <div className="type-pills">
          {Object.entries(stats.byType).map(([type, count]) => (
            <div key={type} className="type-pill">
              {activityEmoji(type)} {type}
              <span className="pill-count">{count}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── PRs ── */}
      {topPRs.length > 0 && (
        <div className="prs-section">
          <div className="prs-label">Personal Records</div>
          <div className="prs-grid">
            {topPRs.map(([name, pr]) => (
              <div key={name} className="pr-tile">
                <div className="pr-name">{name}</div>
                <div className="pr-weight">🏆 {pr.weight} kg</div>
                <div className="pr-date">{new Date(pr.date + 'T12:00:00').toLocaleDateString('en', { day: 'numeric', month: 'short' })}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Rep tracker ── */}
      <div className="rep-tracker-section">
        <div className="rep-tracker-label">Rep Tracker — all time</div>
        <div className="rep-tracker-grid">
          {REP_TRACKERS.map(t => {
            const { total, week } = countReps(activities, t.names);
            return (
              <div key={t.key} className="rep-tracker-card">
                <div className="rep-tracker-emoji">{t.emoji}</div>
                <div className="rep-tracker-info">
                  <div className="rep-tracker-name">{t.label}</div>
                  <div className="rep-tracker-total">{total.toLocaleString()} reps total</div>
                  <div className="rep-tracker-week">+{week} this week</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Contribution graph ── */}
      <ContributionGraph activityMap={dayMap} />

      {/* ── Recent activities ── */}
      <div className="recent-header"><h2>Recent Activities</h2></div>

      {recent.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🏁</div>
          <p>No activities yet — add one or sync Google Fit!</p>
        </div>
      ) : (
        <div className="activity-list">
          {recent.map(a => {
            const vol = calcVolume(a);
            const pr  = isPR(a, prMap);
            return (
              <div key={a.id} className={`activity-row source-${a.source}`}>
                <div className="act-emoji">{activityEmoji(a.type)}</div>
                <div className="act-body">
                  <div className="act-name">
                    {a.name}
                    {pr && <span className="pr-badge" title="Personal Record">🏆</span>}
                  </div>
                  <div className="act-meta">
                    <span>{new Date(a.date).toLocaleDateString('en', { day: 'numeric', month: 'short' })}{a.time ? ` · ${a.time}` : ''}</span>
                    {formatDetail(a) !== '—' && <span className="act-detail">{formatDetail(a)}</span>}
                    {vol && <span className="vol-chip">{fmtVolume(vol)}</span>}
                    <span className={`badge ${a.source === 'google-fit' ? 'badge-blue' : 'badge-green'}`}>
                      {a.source === 'google-fit' ? 'Fit' : 'Manual'}
                    </span>
                  </div>
                </div>
                {a.source === 'manual' && (
                  <div className="act-actions">
                    <button className="edit-btn" onClick={() => onEdit(a)} title="Edit">✏️</button>
                    <button className="del-btn" onClick={() => onDelete(a.id)} title="Delete">✕</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
