// ── PR tracking ──────────────────────────────────────────────────────────────

// Returns Map<exerciseName, { weight, date, activityId }>
export function computePRMap(activities) {
  const map = new Map();
  const sorted = [...activities]
    .filter(a => a.name && a.weight && parseFloat(a.weight) > 0)
    .sort((a, b) => {
      const d = a.date.localeCompare(b.date);
      return d !== 0 ? d : (a.time || '').localeCompare(b.time || '');
    });

  sorted.forEach(a => {
    const w = parseFloat(a.weight);
    const cur = map.get(a.name);
    if (!cur || w > cur.weight) {
      map.set(a.name, { weight: w, date: a.date, activityId: a.id });
    }
  });
  return map;
}

export function isPR(activity, prMap) {
  if (!activity.weight || !activity.name) return false;
  return prMap.get(activity.name)?.activityId === activity.id;
}

// ── Volume ───────────────────────────────────────────────────────────────────

export function calcVolume(a) {
  const s = parseInt(a.sets), r = parseInt(a.reps), w = parseFloat(a.weight);
  if (!s || !r || !w) return null;
  return Math.round(s * r * w);
}

export function fmtVolume(v) {
  if (v == null) return null;
  return v >= 1000 ? `${(v / 1000).toFixed(1)}t` : `${v} kg`;
}

export function weeklyVolume(activities) {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  return activities
    .filter(a => new Date(a.date) >= weekAgo)
    .reduce((sum, a) => sum + (calcVolume(a) || 0), 0);
}

// ── Streaks ──────────────────────────────────────────────────────────────────

export function calcStreaks(activities) {
  if (!activities.length) return { current: 0, longest: 0 };

  const dates = new Set(activities.map(a => a.date));
  const today     = dateStr(new Date());
  const yesterday = dateStr(new Date(Date.now() - 86400000));

  // Current streak: count back from today (or yesterday if today has no activity)
  let current = 0;
  let start = dates.has(today) ? today : dates.has(yesterday) ? yesterday : null;
  if (start) {
    let d = new Date(start + 'T12:00:00');
    while (dates.has(dateStr(d))) { current++; d.setDate(d.getDate() - 1); }
  }

  // Longest streak
  const sorted = [...dates].sort();
  let longest = 0, run = 1;
  for (let i = 1; i < sorted.length; i++) {
    const diff = (new Date(sorted[i] + 'T12:00:00') - new Date(sorted[i-1] + 'T12:00:00')) / 86400000;
    if (diff === 1) { run++; if (run > longest) longest = run; }
    else { run = 1; }
  }
  longest = Math.max(longest, current, sorted.length ? 1 : 0);

  return { current, longest };
}

export function activitiesPerDay(activities) {
  const map = {};
  activities.forEach(a => { map[a.date] = (map[a.date] || 0) + 1; });
  return map;
}

// ── CSV export ───────────────────────────────────────────────────────────────

export function exportCSV(activities) {
  const cols = ['date', 'time', 'type', 'name', 'sets', 'reps', 'weight', 'duration', 'notes', 'source'];
  const header = cols.join(',');
  const rows = activities
    .sort((a, b) => b.date.localeCompare(a.date))
    .map(a => cols.map(c => {
      const v = a[c] ?? '';
      return `"${String(v).replace(/"/g, '""')}"`;
    }).join(','));

  const csv = [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `activities-${dateStr(new Date())}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function dateStr(d) { return d.toISOString().split('T')[0]; }
