import express from 'express';
import { readActivities, writeActivities } from '../utils/csv.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const activities = await readActivities();
    res.json(activities);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { type, name, date, time, duration, sets, reps, weight, notes } = req.body;

    if (!type || !name || !date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const activities = await readActivities();
    const newActivity = {
      id: Date.now().toString(),
      type,
      name,
      date,
      time: time || '',
      duration: duration || '',
      sets: sets || '',
      reps: reps || '',
      weight: weight || '',
      notes: notes || '',
      source: 'manual',
      createdAt: new Date().toISOString()
    };

    activities.push(newActivity);
    await writeActivities(activities);

    res.status(201).json(newActivity);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { type, name, date, time, duration, sets, reps, weight, notes } = req.body;
    const activities = await readActivities();
    const idx = activities.findIndex(a => a.id === req.params.id);

    if (idx === -1) return res.status(404).json({ error: 'Activity not found' });

    const existing = activities[idx];
    activities[idx] = {
      ...existing,
      type:     type     ?? existing.type,
      name:     name     ?? existing.name,
      date:     date     ?? existing.date,
      time:     time     !== undefined ? time     : existing.time,
      duration: duration !== undefined ? duration : existing.duration,
      sets:     sets     !== undefined ? sets     : existing.sets,
      reps:     reps     !== undefined ? reps     : existing.reps,
      weight:   weight   !== undefined ? weight   : existing.weight,
      notes:    notes    !== undefined ? notes    : existing.notes,
    };

    await writeActivities(activities);
    res.json(activities[idx]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const activities = await readActivities();
    const filtered = activities.filter(a => a.id !== req.params.id);
    await writeActivities(filtered);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
