import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROFILE_PATH = path.join(__dirname, '../data/profile.json');

function readProfile() {
  if (!fs.existsSync(PROFILE_PATH)) return { height: '' };
  return JSON.parse(fs.readFileSync(PROFILE_PATH, 'utf-8'));
}

const router = express.Router();

router.get('/', (req, res) => res.json(readProfile()));

router.put('/', (req, res) => {
  const profile = { ...readProfile(), ...req.body };
  fs.writeFileSync(PROFILE_PATH, JSON.stringify(profile, null, 2));
  res.json(profile);
});

export default router;
