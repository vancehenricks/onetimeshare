import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { secretStore } from './server/secretStore.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app: Express = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '2mb' }));

// API Routes
app.post('/api/secrets', (req: Request, res: Response): void => {
  try {
    const { encryptedContent } = req.body;

    if (!encryptedContent || typeof encryptedContent !== 'string') {
      res.status(400).json({ error: 'Encrypted content is required and must be a string' });
      return;
    }

    const { id, expiresAt } = secretStore.createSecret(encryptedContent);
    const shareUrl = `${req.protocol}://${req.get('host')}/share/${id}`;

    res.json({
      id,
      shareUrl,
      expiresAt,
      expiresIn: expiresAt - Date.now()
    });
  } catch (error) {
    console.error('Error creating secret:', error);
    res.status(500).json({ error: 'Failed to create secret' });
  }
});

app.get('/api/secrets/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const encryptedContent = secretStore.getSecret(id);

    if (!encryptedContent) {
      res.status(404).json({ error: 'Secret not found or has expired' });
      return;
    }

    res.json({ encryptedContent });
  } catch (error) {
    console.error('Error retrieving secret:', error);
    res.status(500).json({ error: 'Failed to retrieve secret' });
  }
});

app.get('/api/secrets/:id/check', (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const isValid = secretStore.isValid(id);

    res.json({ valid: isValid });
  } catch (error) {
    console.error('Error checking secret:', error);
    res.status(500).json({ error: 'Failed to check secret' });
  }
});

// Serve static files from Vite build (prefer dist/public if it exists)
const defaultPublic = path.join(__dirname, './public');
const distPublic = path.join(__dirname, '../dist/public');
const publicPath = fs.existsSync(distPublic) ? distPublic : defaultPublic;
app.use(express.static(publicPath));

// Catch-all route for SPA
app.get('*', (req: Request, res: Response): void => {
  res.sendFile(path.join(publicPath, 'index.html'), (err) => {
    if (err) {
      res.status(404).json({ error: 'Not found' });
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
