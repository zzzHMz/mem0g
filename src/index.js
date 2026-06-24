import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { apiRouter } from './routes/api.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;
const DEMO_MODE = process.env.DEMO_MODE === 'true';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API routes
app.use('/api', apiRouter);

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════╗
║           🧠  Mem0G  v1.0.0             ║
║    AI Memory Companion on 0G             ║
╠══════════════════════════════════════════╣
║  Mode : ${DEMO_MODE ? '🔷 DEMO (no 0G tokens needed)' : '🔶 LIVE (0G connected)'}
║  Port : ${PORT}
║  URL  : http://localhost:${PORT}
╚══════════════════════════════════════════╝
  `);
});
