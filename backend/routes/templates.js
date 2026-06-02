import express from 'express';
import supabase from '../utils/supabase.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase.from('templates').select('*').order('name');
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, description, exercises } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Name required' });

    const row = {
      id:          Date.now().toString(),
      name:        name.trim(),
      description: description?.trim() || '',
      exercises:   exercises || [],
    };

    const { data, error } = await supabase.from('templates').insert(row).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, description, exercises } = req.body;
    const updates = {};
    if (name        !== undefined) updates.name        = name.trim();
    if (description !== undefined) updates.description = description.trim();
    if (exercises   !== undefined) updates.exercises   = exercises;

    const { data, error } = await supabase
      .from('templates')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Not found' });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('templates').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
