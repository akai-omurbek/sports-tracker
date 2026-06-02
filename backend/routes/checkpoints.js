import express from 'express';
import multer from 'multer';
import supabase from '../utils/supabase.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } });

const BUCKET = 'photos';

function toFrontend(row) {
  if (!row) return row;
  const { body_fat, _photo_filename, ...rest } = row;
  return { ...rest, bodyFat: body_fat };
}

async function uploadPhoto(file) {
  const ext = file.originalname.split('.').pop();
  const filename = `${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filename, file.buffer, { contentType: file.mimetype });
  if (error) throw error;
  return { filename, url: supabase.storage.from(BUCKET).getPublicUrl(filename).data.publicUrl };
}

async function deletePhoto(filename) {
  await supabase.storage.from(BUCKET).remove([filename]);
}

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('checkpoints')
      .select('*')
      .order('date', { ascending: false });
    if (error) throw error;
    res.json(data.map(toFrontend));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Photo is required' });
    const { date, weight, bodyFat, chest, waist, hips, arms, notes } = req.body;
    if (!date) return res.status(400).json({ error: 'Date is required' });

    const { filename, url } = await uploadPhoto(req.file);

    const row = {
      id:       Date.now().toString(),
      date,
      photo:    url,
      _photo_filename: filename,
      weight:   weight   || '',
      body_fat: bodyFat  || '',
      chest:    chest    || '',
      waist:    waist    || '',
      hips:     hips     || '',
      arms:     arms     || '',
      notes:    notes    || '',
    };

    const { data, error } = await supabase.from('checkpoints').insert(row).select().single();
    if (error) throw error;
    res.status(201).json(toFrontend(data));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', upload.single('photo'), async (req, res) => {
  try {
    const { date, weight, bodyFat, chest, waist, hips, arms, notes } = req.body;

    const updates = {};
    if (date    !== undefined) updates.date     = date;
    if (weight  !== undefined) updates.weight   = weight;
    if (bodyFat !== undefined) updates.body_fat = bodyFat;
    if (chest   !== undefined) updates.chest    = chest;
    if (waist   !== undefined) updates.waist    = waist;
    if (hips    !== undefined) updates.hips     = hips;
    if (arms    !== undefined) updates.arms     = arms;
    if (notes   !== undefined) updates.notes    = notes;

    if (req.file) {
      // Delete old photo from storage
      const { data: existing } = await supabase
        .from('checkpoints')
        .select('_photo_filename')
        .eq('id', req.params.id)
        .single();
      if (existing?._photo_filename) await deletePhoto(existing._photo_filename);

      const { filename, url } = await uploadPhoto(req.file);
      updates.photo = url;
      updates._photo_filename = filename;
    }

    const { data, error } = await supabase
      .from('checkpoints')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Not found' });
    res.json(toFrontend(data));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { data: existing } = await supabase
      .from('checkpoints')
      .select('_photo_filename')
      .eq('id', req.params.id)
      .single();
    if (existing?._photo_filename) await deletePhoto(existing._photo_filename);

    const { error } = await supabase.from('checkpoints').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
