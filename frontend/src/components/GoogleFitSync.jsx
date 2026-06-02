import React, { useState } from 'react';
import axios from 'axios';
import './GoogleFitSync.css';

function GoogleFitSync({ accessToken, setAccessToken, activities, setActivities }) {
  const [loading, setLoading] = useState(false);
  const [daysBack, setDaysBack] = useState(7);

  const handleLoginClick = async () => {
    try {
      const response = await axios.get('/api/auth/google-url');
      window.location.href = response.data.authUrl;
    } catch (error) {
      console.error('Error getting auth URL:', error);
      alert('Failed to get Google auth URL');
    }
  };

  const handleSyncClick = async () => {
    if (!accessToken) {
      alert('Please login with Google first');
      return;
    }

    setLoading(true);
    try {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - daysBack * 24 * 60 * 60 * 1000);

      const response = await axios.post('/api/googlefit/fetch-activities', {
        accessToken,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      });

      // Merge with existing activities, avoiding duplicates
      const existingIds = new Set(activities.map(a => a.id));
      const newActivities = response.data.filter(a => !existingIds.has(a.id));

      setActivities([...activities, ...newActivities]);

      alert(`Synced ${newActivities.length} activities from Google Fit!`);
    } catch (error) {
      console.error('Error syncing with Google Fit:', error);
      alert('Failed to sync with Google Fit. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setAccessToken(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  };

  return (
    <div className="google-fit-sync">
      <div className="sync-card">
        <h2>Google Fit Integration</h2>

        {!accessToken ? (
          <div className="login-section">
            <p>Connect your Google account to sync auto-detected activities</p>
            <button onClick={handleLoginClick} className="login-btn">
              🔗 Login with Google
            </button>
          </div>
        ) : (
          <div className="sync-section">
            <div className="status">
              <span className="status-badge active">✓ Connected</span>
            </div>

            <div className="sync-controls">
              <div className="days-selector">
                <label htmlFor="days">Fetch last</label>
                <select
                  id="days"
                  value={daysBack}
                  onChange={(e) => setDaysBack(parseInt(e.target.value))}
                  disabled={loading}
                >
                  <option value="1">1 day</option>
                  <option value="7">7 days</option>
                  <option value="30">30 days</option>
                  <option value="90">90 days</option>
                </select>
              </div>

              <button
                onClick={handleSyncClick}
                disabled={loading}
                className="sync-btn"
              >
                {loading ? 'Syncing...' : '⟳ Sync Now'}
              </button>
            </div>

            <button onClick={handleLogout} className="logout-btn">
              Disconnect
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default GoogleFitSync;
