import express from 'express';
import path from 'path';
import multer from 'multer';
import { createServer as createViteServer } from 'vite';
import {
  getDriveAbout,
  getOrCreateFolderHandler,
  listFolderFiles,
  uploadPhotoHandler,
  deleteFileHandler,
} from './server/driveService.ts';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON & URL-encoded body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Multer memory storage (never leaves uncleaned files on server disk)
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB per file
    },
  });

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'Google Drive Photo Backup Backend',
      timestamp: new Date().toISOString(),
    });
  });

  // Google Drive user profile & storage quota
  app.get('/api/drive/about', getDriveAbout);

  // Backup folder get / create
  app.get('/api/drive/folder', getOrCreateFolderHandler);

  // Live backup files in Google Drive folder
  app.get('/api/drive/files', listFolderFiles);

  // Upload photo directly to Google Drive
  app.post('/api/drive/upload', upload.single('photo'), uploadPhotoHandler);

  // Delete file in Google Drive (destructive operation)
  app.delete('/api/drive/files/:fileId', deleteFileHandler);

  // Vite middleware for development or static serving for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Photo Backup Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
