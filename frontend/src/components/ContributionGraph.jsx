import React, { useMemo } from 'react';
import './ContributionGraph.css';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function level(count) {
  if (!count) return 0;
  if (count === 1) return 1;
  if (count === 2) return 2;
  if (count <= 4) return 3;
  return 4;
}

export default function ContributionGraph({ activityMap }) {
  const weeks = useMemo(() => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    // Align to Sunday of the current week
    const endSunday = new Date(today);
    endSunday.setDate(today.getDate() + (6 - today.getDay()) + 1); // next Saturday end

    // Go back 52 weeks from last Saturday
    const endDay = new Date(today);
    endDay.setDate(today.getDate() + (6 - today.getDay())); // last Saturday
    const startDay = new Date(endDay);
    startDay.setDate(endDay.getDate() - 52 * 7 + 1);
    // Start from the Sunday of that week
    startDay.setDate(startDay.getDate() - startDay.getDay());

    const grid = [];
    let cur = new Date(startDay);
    let week = [];
    let monthLabels = [];

    while (cur <= endDay) {
      const ds = cur.toISOString().split('T')[0];
      const count = activityMap[ds] || 0;
      const isFuture = cur > today;

      // Month label on first day of month
      if (cur.getDate() === 1 && week.length > 0) {
        monthLabels.push({ weekIdx: grid.length, month: MONTHS[cur.getMonth()] });
      }

      week.push({ date: ds, count, level: isFuture ? -1 : level(count), day: cur.getDay() });

      if (cur.getDay() === 6) {
        grid.push(week);
        week = [];
      }
      cur.setDate(cur.getDate() + 1);
    }
    if (week.length) grid.push(week);

    return { grid, monthLabels };
  }, [activityMap]);

  const total = useMemo(() => Object.values(activityMap).reduce((s, v) => s + v, 0), [activityMap]);
  const activeDays = Object.keys(activityMap).length;

  return (
    <div className="contrib-wrap">
      <div className="contrib-header">
        <span className="contrib-title">Activity Calendar</span>
        <span className="contrib-summary">{total} activities across {activeDays} days</span>
      </div>

      <div className="contrib-scroll">
        <div className="contrib-grid-wrap">
          {/* Month labels */}
          <div className="month-labels">
            {weeks.monthLabels.map((m, i) => (
              <span key={i} className="month-label" style={{ gridColumnStart: m.weekIdx + 1 }}>{m.month}</span>
            ))}
          </div>

          <div className="contrib-inner">
            {/* Day labels */}
            <div className="day-labels">
              {[1, 3, 5].map(d => (
                <span key={d} className="day-label" style={{ gridRowStart: d + 1 }}>{DAYS[d]}</span>
              ))}
            </div>

            {/* Weeks grid */}
            <div className="contrib-grid">
              {weeks.grid.map((week, wi) => (
                <div key={wi} className="contrib-week">
                  {Array.from({ length: 7 }, (_, di) => {
                    const cell = week.find(c => c.day === di);
                    if (!cell) return <div key={di} className="contrib-cell empty" />;
                    return (
                      <div
                        key={di}
                        className={`contrib-cell level-${cell.level}`}
                        title={cell.level === -1 ? cell.date : `${cell.date}: ${cell.count} activit${cell.count === 1 ? 'y' : 'ies'}`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="contrib-legend">
          <span>Less</span>
          {[0,1,2,3,4].map(l => <div key={l} className={`contrib-cell level-${l}`} />)}
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
