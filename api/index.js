/**
 * Vercel Serverless Entry Point
 *
 * Exports the Express app as a serverless function.
 * Static files are served via the app's express.static middleware.
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { apiRouter } from '../src/routes/api.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from src/public
app.use(express.static(path.join(__dirname, '..', 'src', 'public')));

// API routes
app.use('/api', apiRouter);

// SPA fallback — serve index.html for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'src', 'public', 'index.html'));
});

// Export for Vercel serverless
export default app;
