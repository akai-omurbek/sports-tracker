import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR   = path.join(__dirname, '../data');
const PHOTOS_DIR = path.join(DATA_DIR, 'photos');
const JSON_PATH  = path.join(DATA_DIR, 'checkpoints.json');

[DATA_DIR, PHOTOS_DIR].forEach(d => { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); });

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, PHOTOS_DIR),
  filename:    (_, file, cb) => cb(null, `${Date.now()}${path.extname(file.originalname)}`)
});
const upload = multer({ storage, limits: { fileSize: 15 * 1024 * 1024 } });

function readCheckpoints() {
  if (!fs.existsSync(JSON_PATH)) return [];
  return JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));
}

function writeCheckpoints(data) {
  fs.writeFileSync(JSON_PATH, JSON.stringify(data, null, 2));
}

const router = express.Router();

router.get('/', (req, res) => {
  res.json(readCheckpoints());
});

router.post('/', upload.single('photo'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Photo is required' });

  const { date, weight, bodyFat, chest, waist, hips, arms, notes } = req.body;
  if (!date) return res.status(400).json({ error: 'Date is required' });

  const checkpoints = readCheckpoints();
  const entry = {
    id: Date.now().toString(),
    date,
    photo: req.file.filename,
    weight:  weight  || '',
    bodyFat: bodyFat || '',
    chest:   chest   || '',
    waist:   waist   || '',
    hips:    hips    || '',
    arms:    arms    || '',
    notes:   notes   || '',
    createdAt: new Date().toISOString()
  };

  checkpoints.push(entry);
  writeCheckpoints(checkpoints);
  res.status(201).json(entry);
});

router.put('/:id', upload.single('photo'), (req, res) => {
  const checkpoints = readCheckpoints();
  const idx = checkpoints.findIndex(c => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });

  const { date, weight, bodyFat, chest, waist, hips, arms, notes } = req.body;
  const existing = checkpoints[idx];

  if (req.file && existing.photo) {
    const oldPath = path.join(PHOTOS_DIR, existing.photo);
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
  }

  checkpoints[idx] = {
    ...existing,
    date:    date    ?? existing.date,
    photo:   req.file ? req.file.filename : existing.photo,
    weight:  weight  !== undefined ? weight  : existing.weight,
    bodyFat: bodyFat !== undefined ? bodyFat : existing.bodyFat,
    chest:   chest   !== undefined ? chest   : existing.chest,
    waist:   waist   !== undefined ? waist   : existing.waist,
    hips:    hips    !== undefined ? hips    : existing.hips,
    arms:    arms    !== undefined ? arms    : existing.arms,
    notes:   notes   !== undefined ? notes   : existing.notes,
  };

  writeCheckpoints(checkpoints);
  res.json(checkpoints[idx]);
});

router.delete('/:id', (req, res) => {
  const checkpoints = readCheckpoints();
  const cp = checkpoints.find(c => c.id === req.params.id);
  if (!cp) return res.status(404).json({ error: 'Not found' });

  const photoPath = path.join(PHOTOS_DIR, cp.photo);
  if (fs.existsSync(photoPath)) fs.unlinkSync(photoPath);

  writeCheckpoints(checkpoints.filter(c => c.id !== req.params.id));
  res.json({ success: true });
});

export default router;
