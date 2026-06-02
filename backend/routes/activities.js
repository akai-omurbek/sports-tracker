import express from 'express';
import supabase from '../utils/supabase.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .order('date', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { type, name, date, time, duration, sets, reps, weight, notes } = req.body;
    if (!type || !name || !date) return res.status(400).json({ error: 'Missing required fields' });

    const row = {
      id: Date.now().toString(),
      type,
      name,
      date,
      time:     time     || '',
      duration: duration || '',
      sets:     sets     || '',
      reps:     reps     || '',
      weight:   weight   || '',
      notes:    notes    || '',
      source:   'manual',
    };

    const { data, error } = await supabase.from('activities').insert(row).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { type, name, date, time, duration, sets, reps, weight, notes } = req.body;
    const updates = {};
    if (type     !== undefined) updates.type     = type;
    if (name     !== undefined) updates.name     = name;
    if (date     !== undefined) updates.date     = date;
    if (time     !== undefined) updates.time     = time;
    if (duration !== undefined) updates.duration = duration;
    if (sets     !== undefined) updates.sets     = sets;
    if (reps     !== undefined) updates.reps     = reps;
    if (weight   !== undefined) updates.weight   = weight;
    if (notes    !== undefined) updates.notes    = notes;

    const { data, error } = await supabase
      .from('activities')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Activity not found' });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('activities').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
