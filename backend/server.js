import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import activitiesRouter from './routes/activities.js';
import authRouter from './routes/auth.js';
import googleFitRouter from './routes/googlefit.js';
import exercisesRouter from './routes/exercises.js';
import checkpointsRouter from './routes/checkpoints.js';
import profileRouter from './routes/profile.js';
import templatesRouter from './routes/templates.js';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Serve uploaded photos as static files
app.use('/photos', express.static(path.join(__dirname, 'data/photos')));

// Routes
app.use('/api/auth', authRouter);
app.use('/api/activities', activitiesRouter);
app.use('/api/googlefit', googleFitRouter);
app.use('/api/exercises', exercisesRouter);
app.use('/api/checkpoints', checkpointsRouter);
app.use('/api/profile', profileRouter);
app.use('/api/templates', templatesRouter);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
