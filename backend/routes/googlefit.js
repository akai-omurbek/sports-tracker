import express from 'express';
import axios from 'axios';

const router = express.Router();

const GOOGLE_FIT_API = 'https://www.googleapis.com/fitness/v1/users/me';

// Fetch activities from Google Fit
router.post('/fetch-activities', async (req, res) => {
  try {
    const { accessToken, startDate, endDate } = req.body;

    if (!accessToken) {
      return res.status(400).json({ error: 'Access token required' });
    }

    // Google Fit requires RFC 3339 timestamps
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // Fetch sessions (high-level activities)
    const sessionsResponse = await axios.get(
      `${GOOGLE_FIT_API}/sessions`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: {
          startTime: start.toISOString(),
          endTime: end.toISOString()
        }
      }
    );

    const sessions = sessionsResponse.data.session || [];

    // Map Google Fit activities to our format
    const activities = sessions.map(session => ({
      id: session.id,
      type: getActivityType(session.activityType),
      name: session.name || getActivityName(session.activityType),
      date: new Date(parseInt(session.startTimeMillis)).toISOString().split('T')[0],
      duration: Math.round((parseInt(session.endTimeMillis) - parseInt(session.startTimeMillis)) / 60000), // in minutes
      distance: session.distance ? Math.round(session.distance / 1000 * 100) / 100 : null, // in km
      calories: session.calories || null,
      source: 'google-fit',
      activityType: session.activityType
    }));

    res.json(activities);
  } catch (error) {
    console.error('Google Fit error:', error.response?.data || error.message);
    res.status(500).json({ error: error.message });
  }
});

function getActivityType(activityTypeId) {
  const activityMap = {
    1: 'Walking',
    2: 'Running',
    7: 'Cycling',
    8: 'Hiking',
    10: 'Workout',
    19: 'Swimming',
    32: 'Yoga',
    33: 'Strength Training'
  };
  return activityMap[activityTypeId] || 'Activity';
}

function getActivityName(activityTypeId) {
  return getActivityType(activityTypeId);
}

export default router;
