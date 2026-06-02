import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PATH = path.join(__dirname, '../data/templates.json');

function read() {
  if (!fs.existsSync(PATH)) return [];
  return JSON.parse(fs.readFileSync(PATH, 'utf-8'));
}
function write(data) { fs.writeFileSync(PATH, JSON.stringify(data, null, 2)); }

const router = express.Router();

router.get('/', (req, res) => res.json(read()));

router.post('/', (req, res) => {
  const { name, description, exercises } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Name required' });
  const templates = read();
  const t = { id: Date.now().toString(), name: name.trim(), description: description?.trim() || '', exercises: exercises || [] };
  templates.push(t);
  write(templates);
  res.status(201).json(t);
});

router.put('/:id', (req, res) => {
  const templates = read();
  const idx = templates.findIndex(t => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const { name, description, exercises } = req.body;
  templates[idx] = { ...templates[idx], name: name?.trim() || templates[idx].name, description: description?.trim() ?? templates[idx].description, exercises: exercises ?? templates[idx].exercises };
  write(templates);
  res.json(templates[idx]);
});

router.delete('/:id', (req, res) => {
  const templates = read();
  const filtered = templates.filter(t => t.id !== req.params.id);
  if (filtered.length === templates.length) return res.status(404).json({ error: 'Not found' });
  write(filtered);
  res.json({ success: true });
});

export default router;
