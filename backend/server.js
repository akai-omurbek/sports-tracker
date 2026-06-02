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

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/activities', activitiesRouter);
app.use('/api/googlefit', googleFitRouter);
app.use('/api/exercises', exercisesRouter);
app.use('/api/checkpoints', checkpointsRouter);
app.use('/api/profile', profileRouter);
app.use('/api/templates', templatesRouter);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// In production (Vercel), serve the React build and handle SPA routing
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '../frontend/build');
  app.use(express.static(frontendPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}

// Listen only in local dev; Vercel imports this module and uses the exported app
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
  });
}

export default app;
