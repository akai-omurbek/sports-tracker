import express from 'express';
import supabase from '../utils/supabase.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase.from('profile').select('*').eq('id', 1).single();
    if (error && error.code !== 'PGRST116') throw error;
    res.json(data || { height: '' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('profile')
      .upsert({ id: 1, ...req.body })
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
