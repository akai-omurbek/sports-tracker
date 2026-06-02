import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const EXERCISES_PATH = path.join(__dirname, '../data/exercises.json');

const DEFAULT_EXERCISES = [
  // Push
  { id: 'bench-press',       name: 'Bench Press',        category: 'Push' },
  { id: 'overhead-press',    name: 'Overhead Press',      category: 'Push' },
  { id: 'incline-bench',     name: 'Incline Bench Press', category: 'Push' },
  { id: 'push-ups',          name: 'Push-ups',            category: 'Push' },
  { id: 'dips',              name: 'Dips',                category: 'Push' },
  // Pull
  { id: 'pull-ups',          name: 'Pull-ups',            category: 'Pull' },
  { id: 'chin-ups',          name: 'Chin-ups',            category: 'Pull' },
  { id: 'barbell-row',       name: 'Barbell Row',         category: 'Pull' },
  { id: 'dumbbell-row',      name: 'Dumbbell Row',        category: 'Pull' },
  { id: 'lat-pulldown',      name: 'Lat Pulldown',        category: 'Pull' },
  { id: 'face-pull',         name: 'Face Pull',           category: 'Pull' },
  // Legs
  { id: 'squat',             name: 'Squat',               category: 'Legs' },
  { id: 'deadlift',          name: 'Deadlift',            category: 'Legs' },
  { id: 'rdl',               name: 'Romanian Deadlift',   category: 'Legs' },
  { id: 'leg-press',         name: 'Leg Press',           category: 'Legs' },
  { id: 'lunges',            name: 'Lunges',              category: 'Legs' },
  { id: 'hip-thrust',        name: 'Hip Thrust',          category: 'Legs' },
  { id: 'calf-raises',       name: 'Calf Raises',         category: 'Legs' },
  // Arms
  { id: 'bicep-curl',        name: 'Bicep Curl',          category: 'Arms' },
  { id: 'hammer-curl',       name: 'Hammer Curl',         category: 'Arms' },
  { id: 'tricep-pushdown',   name: 'Tricep Pushdown',     category: 'Arms' },
  { id: 'skull-crusher',     name: 'Skull Crusher',       category: 'Arms' },
  // Core
  { id: 'plank',             name: 'Plank',               category: 'Core' },
  { id: 'ab-wheel',          name: 'Ab Wheel',            category: 'Core' },
  { id: 'hanging-leg-raise', name: 'Hanging Leg Raise',   category: 'Core' },
];

function readExercises() {
  const dataDir = path.dirname(EXERCISES_PATH);
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(EXERCISES_PATH)) {
    fs.writeFileSync(EXERCISES_PATH, JSON.stringify(DEFAULT_EXERCISES, null, 2));
    return [...DEFAULT_EXERCISES];
  }
  return JSON.parse(fs.readFileSync(EXERCISES_PATH, 'utf-8'));
}

function writeExercises(exercises) {
  fs.writeFileSync(EXERCISES_PATH, JSON.stringify(exercises, null, 2));
}

const router = express.Router();

router.get('/', (req, res) => {
  res.json(readExercises());
});

router.post('/', (req, res) => {
  const { name, category, instructions } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Name required' });
  const exercises = readExercises();
  const newEx = {
    id: Date.now().toString(),
    name: name.trim(),
    category: category?.trim() || 'Other',
    instructions: instructions?.trim() || ''
  };
  exercises.push(newEx);
  writeExercises(exercises);
  res.status(201).json(newEx);
});

router.put('/:id', (req, res) => {
  const { name, category, instructions } = req.body;
  const exercises = readExercises();
  const idx = exercises.findIndex(e => e.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  exercises[idx] = {
    ...exercises[idx],
    name: name?.trim() || exercises[idx].name,
    category: category?.trim() || exercises[idx].category,
    instructions: instructions !== undefined ? instructions.trim() : (exercises[idx].instructions || '')
  };
  writeExercises(exercises);
  res.json(exercises[idx]);
});

router.delete('/:id', (req, res) => {
  const exercises = readExercises();
  const filtered = exercises.filter(e => e.id !== req.params.id);
  if (filtered.length === exercises.length) return res.status(404).json({ error: 'Not found' });
  writeExercises(filtered);
  res.json({ success: true });
});

export default router;
